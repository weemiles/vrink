import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Iterable, List, Tuple

from .models import ManualSignal, MarketSnapshot, Opportunity
from .signals import load_manual_signals, write_manual_signals


READY_STATUSES = {"ready", "paper_ready", "active"}


def prepare_research_packets(
    research_dir: Path,
    markets: Iterable[MarketSnapshot],
    opportunities: Iterable[Opportunity],
    limit: int,
    overwrite: bool = False,
) -> List[Dict[str, str]]:
    market_map = {market.slug: market for market in markets}
    queue: List[Tuple[MarketSnapshot, Opportunity]] = []
    for opportunity in opportunities:
        if opportunity.action != "REVIEW":
            continue
        market = market_map.get(opportunity.slug)
        if market is None:
            continue
        queue.append((market, opportunity))

    queue.sort(
        key=lambda item: (
            -item[1].quality_score,
            -item[1].liquidity,
            -item[1].volume,
            item[1].hours_to_close if item[1].hours_to_close is not None else 10 ** 9,
        )
    )

    created: List[Dict[str, str]] = []
    for market, opportunity in queue[:limit]:
        slug_dir = research_dir / _safe_slug(market.slug)
        slug_dir.mkdir(parents=True, exist_ok=True)
        brief_path = slug_dir / "brief.md"
        thesis_path = slug_dir / "thesis.json"

        if overwrite or not brief_path.exists():
            brief_path.write_text(_build_brief(market, opportunity), encoding="utf-8")
        if overwrite or not thesis_path.exists():
            thesis_path.write_text(
                json.dumps(_build_thesis_template(market, opportunity), indent=2, ensure_ascii=True) + "\n",
                encoding="utf-8",
            )

        created.append(
            {
                "slug": market.slug,
                "brief_path": str(brief_path),
                "thesis_path": str(thesis_path),
            }
        )

    (research_dir / "queue.json").write_text(
        json.dumps(created, indent=2, ensure_ascii=True) + "\n",
        encoding="utf-8",
    )
    return created


def compile_research_signals(research_dir: Path, output_path: Path) -> Dict[str, object]:
    dossiers = sorted(research_dir.glob("*/thesis.json"))
    merged = load_manual_signals(output_path)
    written: List[str] = []
    skipped: List[Dict[str, str]] = []

    for dossier in dossiers:
        payload = json.loads(dossier.read_text(encoding="utf-8"))
        slug = str(payload.get("slug", "")).strip()
        status = str(payload.get("status", "")).strip().lower()
        fair_yes = payload.get("fair_yes_probability")
        rationale = str(payload.get("rationale", "")).strip()

        if not slug:
            skipped.append({"path": str(dossier), "reason": "missing slug"})
            continue
        if status not in READY_STATUSES:
            skipped.append({"path": str(dossier), "reason": "status is not ready"})
            continue
        if fair_yes is None:
            skipped.append({"path": str(dossier), "reason": "missing fair_yes_probability"})
            continue

        notes: List[str] = []
        confidence = payload.get("confidence")
        if confidence is not None:
            notes.append("Research confidence: {}".format(confidence))

        for item in payload.get("sources", []):
            if isinstance(item, str) and item.strip():
                notes.append("Source: {}".format(item.strip()))

        entry = ManualSignal(
            slug=slug,
            fair_yes_probability=float(fair_yes),
            rationale=rationale or "Compiled from research dossier.",
            notes=notes,
        )
        merged[slug] = entry
        written.append(slug)

    write_manual_signals(output_path, merged)
    return {"written": written, "skipped": skipped, "output_path": str(output_path)}


def _build_brief(market: MarketSnapshot, opportunity: Opportunity) -> str:
    lines = [
        "# {}".format(market.question or market.slug),
        "",
        "## Live snapshot",
        "",
        "- Slug: `{}`".format(market.slug),
        "- Category: `{}`".format(market.category or "unknown"),
        "- YES ask: `{}`".format(_fmt_price(opportunity.yes_ask)),
        "- NO ask: `{}`".format(_fmt_price(opportunity.no_ask)),
        "- Liquidity: `${:,.0f}`".format(opportunity.liquidity),
        "- Volume: `${:,.0f}`".format(opportunity.volume),
        "- Hours to close: `{}`".format(_fmt_hours(opportunity.hours_to_close)),
        "",
        "## Mandatory checklist",
        "",
        "- [ ] Read the exact resolution rules and identify any ambiguity.",
        "- [ ] Confirm what source ultimately decides the outcome.",
        "- [ ] Check whether the market can be clarified or extended later.",
        "- [ ] Verify liquidity and spread are still acceptable right now.",
        "- [ ] List the next catalyst or deadline that could move probability.",
        "",
        "## Research questions",
        "",
        "1. What base rate should this market start from?",
        "2. What are the main YES drivers?",
        "3. What are the main NO drivers?",
        "4. Which outside data source should move my estimate the most?",
        "5. Under what scenario would I refuse to trade this market at all?",
        "",
        "## Suggested evidence to gather",
        "",
        "- Official rules or primary source announcements",
        "- Forecast, odds, poll, or market-implied comparison",
        "- Recent news flow and catalyst timeline",
        "- Reasons Polymarket might be mispriced rather than simply efficient",
        "",
        "## Current bot notes",
        "",
    ]
    lines.extend("- {}".format(note) for note in opportunity.notes[:6])
    lines.extend(
        [
            "",
            "## Convert research into a fair value",
            "",
            "Use the paired `thesis.json` file to record:",
            "",
            "- `fair_yes_probability`",
            "- `confidence`",
            "- `rationale`",
            "- `sources`",
            "- `status` set to `ready` only when you want it compiled into `manual_signals.json`",
            "",
        ]
    )
    return "\n".join(lines).rstrip() + "\n"


def _build_thesis_template(market: MarketSnapshot, opportunity: Opportunity) -> Dict[str, object]:
    return {
        "slug": market.slug,
        "question": market.question,
        "status": "researching",
        "category": market.category,
        "yes_ask_snapshot": opportunity.yes_ask,
        "no_ask_snapshot": opportunity.no_ask,
        "liquidity_snapshot": opportunity.liquidity,
        "volume_snapshot": opportunity.volume,
        "hours_to_close_snapshot": opportunity.hours_to_close,
        "fair_yes_probability": None,
        "confidence": None,
        "rationale": "",
        "sources": [],
        "scenario_tree": {
            "yes_case_probability": None,
            "neutral_case_probability": None,
            "no_case_probability": None,
        },
        "checklist": {
            "resolution_rules_checked": False,
            "primary_sources_checked": False,
            "liquidity_checked": False,
            "catalyst_timeline_checked": False,
            "reason_for_mispricing_written": False,
        },
        "entry_plan": {
            "desired_yes_price_below": None,
            "desired_no_price_below": None,
            "max_position_pct_override": None,
        },
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }


def _fmt_price(value):
    if value is None:
        return "n/a"
    return "{:.4f}".format(value)


def _fmt_hours(value):
    if value is None:
        return "n/a"
    return "{:.1f}".format(value)


def _safe_slug(raw_slug: str) -> str:
    return raw_slug.replace("/", "-").replace("\\", "-").strip()
