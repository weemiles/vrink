import json
import math
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional


@dataclass(frozen=True)
class PollEntry:
    pollster: str
    field_date_end: datetime
    candidate_support: float
    opponent_support: float
    population: str
    sample_size: Optional[int]
    quality: float
    source: str

    @property
    def margin_points(self) -> float:
        return self.candidate_support - self.opponent_support


def run_poll_model(config_path: Path, write_thesis: bool = False) -> Dict[str, object]:
    config = json.loads(config_path.read_text(encoding="utf-8"))
    election_date = _parse_datetime(config["election_date"])
    now = _parse_datetime(config["as_of"]) if config.get("as_of") else datetime.now(timezone.utc)
    half_life_days = float(config.get("half_life_days", 10.0))
    logistic_scale_points = float(config.get("logistic_scale_points", 6.0))
    adjustments = config.get("adjustments", {})
    polls = [_parse_poll(item) for item in config.get("polls", [])]

    weighted_rows = []
    total_weight = 0.0
    weighted_margin = 0.0

    for poll in polls:
        age_days = max(0.0, (now - poll.field_date_end).total_seconds() / 86400.0)
        recency_weight = 0.5 ** (age_days / max(half_life_days, 0.1))
        sample_weight = math.sqrt((poll.sample_size or 1000) / 1000.0)
        population_weight = _population_weight(poll.population)
        weight = recency_weight * sample_weight * population_weight * max(poll.quality, 0.1)
        total_weight += weight
        weighted_margin += poll.margin_points * weight
        weighted_rows.append(
            {
                "pollster": poll.pollster,
                "field_date_end": poll.field_date_end.isoformat(),
                "candidate_support": poll.candidate_support,
                "opponent_support": poll.opponent_support,
                "margin_points": round(poll.margin_points, 3),
                "population": poll.population,
                "sample_size": poll.sample_size,
                "quality": poll.quality,
                "weight": round(weight, 4),
                "source": poll.source,
            }
        )

    if total_weight <= 0:
        raise ValueError("Poll model needs at least one valid poll entry.")

    weighted_margin /= total_weight
    adjustment_points = (
        float(adjustments.get("incumbency_points", 0.0))
        + float(adjustments.get("system_points", 0.0))
        + float(adjustments.get("late_campaign_risk_points", 0.0))
        + float(adjustments.get("other_points", 0.0))
    )
    adjusted_margin = weighted_margin + adjustment_points
    fair_yes_probability = _logistic(adjusted_margin / logistic_scale_points)
    confidence = _confidence_score(polls=polls, now=now, election_date=election_date, adjusted_margin=adjusted_margin)

    result = {
        "candidate_name": config.get("candidate_name"),
        "opponent_name": config.get("opponent_name"),
        "market_slug": config.get("market_slug"),
        "as_of": now.isoformat(),
        "election_date": election_date.isoformat(),
        "days_to_election": round((election_date - now).total_seconds() / 86400.0, 2),
        "weighted_margin_points": round(weighted_margin, 3),
        "adjustment_points": round(adjustment_points, 3),
        "adjusted_margin_points": round(adjusted_margin, 3),
        "fair_yes_probability": round(fair_yes_probability, 4),
        "confidence": round(confidence, 3),
        "poll_count": len(polls),
        "polls": weighted_rows,
        "explanation": _build_explanation(config, weighted_margin, adjustment_points, fair_yes_probability),
    }

    report_path = config_path.parent / "poll_model_output.json"
    report_path.write_text(json.dumps(result, indent=2, ensure_ascii=True) + "\n", encoding="utf-8")
    result["report_path"] = str(report_path)

    if write_thesis:
        thesis_path = Path(config["thesis_path"])
        _write_thesis(thesis_path, result)
        result["thesis_path"] = str(thesis_path)

    return result


def _parse_poll(raw: Dict[str, object]) -> PollEntry:
    return PollEntry(
        pollster=str(raw["pollster"]),
        field_date_end=_parse_datetime(str(raw["field_date_end"])),
        candidate_support=float(raw["candidate_support"]),
        opponent_support=float(raw["opponent_support"]),
        population=str(raw.get("population", "all_voters")),
        sample_size=int(raw["sample_size"]) if raw.get("sample_size") is not None else None,
        quality=float(raw.get("quality", 1.0)),
        source=str(raw.get("source", "")),
    )


def _parse_datetime(raw: str) -> datetime:
    text = raw.strip()
    if text.endswith("Z"):
        text = text[:-1] + "+00:00"
    dt = datetime.fromisoformat(text)
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def _population_weight(population: str) -> float:
    normalized = population.strip().lower()
    if normalized == "all_voters":
        return 1.0
    if normalized == "likely_voters":
        return 0.95
    if normalized == "decided_voters":
        return 0.75
    return 0.85


def _logistic(value: float) -> float:
    return 1.0 / (1.0 + math.exp(-value))


def _confidence_score(polls: List[PollEntry], now: datetime, election_date: datetime, adjusted_margin: float) -> float:
    if not polls:
        return 0.0
    latest_poll_age = min(max((now - poll.field_date_end).total_seconds() / 86400.0, 0.0) for poll in polls)
    recency_score = max(0.0, min(1.0, 1.0 - (latest_poll_age / 21.0)))
    poll_count_score = max(0.0, min(1.0, len(polls) / 4.0))
    margin_score = max(0.0, min(1.0, abs(adjusted_margin) / 12.0))
    time_score = max(0.0, min(1.0, 1.0 - (((election_date - now).total_seconds() / 86400.0) / 60.0)))
    return (0.35 * recency_score) + (0.20 * poll_count_score) + (0.25 * margin_score) + (0.20 * time_score)


def _build_explanation(
    config: Dict[str, object],
    weighted_margin: float,
    adjustment_points: float,
    fair_yes_probability: float,
) -> str:
    candidate_name = config.get("candidate_name", "Candidate")
    opponent_name = config.get("opponent_name", "opponent")
    return (
        "Polling model estimate for {candidate}: weighted polling margin is {margin:.1f} points versus {opponent}. "
        "After applying explicit structural adjustments of {adjustment:.1f} points, the model maps the adjusted "
        "margin into a fair YES probability of {fair:.1%}."
    ).format(
        candidate=candidate_name,
        margin=weighted_margin,
        opponent=opponent_name,
        adjustment=adjustment_points,
        fair=fair_yes_probability,
    )


def _write_thesis(thesis_path: Path, result: Dict[str, object]) -> None:
    thesis = json.loads(thesis_path.read_text(encoding="utf-8"))
    thesis["fair_yes_probability"] = result["fair_yes_probability"]
    thesis["confidence"] = result["confidence"]
    existing_rationale = str(thesis.get("rationale", "")).strip()
    model_explanation = str(result["explanation"]).strip()
    if existing_rationale.startswith(model_explanation):
        thesis["rationale"] = existing_rationale
    elif existing_rationale:
        thesis["rationale"] = "{} {}".format(model_explanation, existing_rationale).strip()
    else:
        thesis["rationale"] = model_explanation

    existing_sources = thesis.get("sources", [])
    if not isinstance(existing_sources, list):
        existing_sources = []
    merged_sources = list(existing_sources)
    for poll in result.get("polls", []):
        source = poll.get("source")
        if source and source not in merged_sources:
            merged_sources.append(source)
    thesis["sources"] = merged_sources
    thesis["poll_model_output"] = {
        "as_of": result["as_of"],
        "weighted_margin_points": result["weighted_margin_points"],
        "adjustment_points": result["adjustment_points"],
        "adjusted_margin_points": result["adjusted_margin_points"],
        "fair_yes_probability": result["fair_yes_probability"],
        "confidence": result["confidence"],
        "poll_count": result["poll_count"],
        "report_path": result["report_path"],
        "explanation": result["explanation"],
    }
    thesis["updated_at"] = datetime.now(timezone.utc).isoformat()
    thesis_path.write_text(json.dumps(thesis, indent=2, ensure_ascii=True) + "\n", encoding="utf-8")
