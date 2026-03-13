import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable, List

from .models import Opportunity


def write_report(reports_dir: Path, opportunities: Iterable[Opportunity], fills: List[dict]) -> None:
    opportunities = list(opportunities)
    json_path = reports_dir / "latest_opportunities.json"
    md_path = reports_dir / "latest_report.md"

    json_path.write_text(
        json.dumps([item.to_dict() for item in opportunities], indent=2, ensure_ascii=True),
        encoding="utf-8",
    )

    lines = [
        "# Polymarket Research Report",
        "",
        "Generated at `{}`".format(datetime.now(timezone.utc).isoformat()),
        "",
        "## Summary",
        "",
        "- Total markets reviewed: `{}`".format(len(opportunities)),
        "- Actionable buys: `{}`".format(sum(1 for item in opportunities if item.action.startswith("BUY"))),
        "- Review-only markets: `{}`".format(sum(1 for item in opportunities if item.action == "REVIEW")),
        "- Paper fills created this run: `{}`".format(len(fills)),
        "",
        "## Top opportunities",
        "",
    ]

    for index, item in enumerate(opportunities[:15], start=1):
        lines.extend(
            [
                "### {}. {} (`{}`)".format(index, item.question or item.slug, item.action),
                "",
                "- Slug: `{}`".format(item.slug),
                "- Market ask: `{}`".format(_fmt_price(item.market_price)),
                "- Fair value: `{}`".format(_fmt_price(item.fair_price)),
                "- Edge: `{}`".format(_fmt_price(item.edge)),
                "- Suggested size: `${:,.2f}`".format(item.size_usd),
                "- Confidence: `{:.3f}`".format(item.confidence),
                "- Quality score: `{:.3f}`".format(item.quality_score),
                "- Liquidity: `${:,.0f}`".format(item.liquidity),
                "- Volume: `${:,.0f}`".format(item.volume),
                "- Hours to close: `{}`".format(_fmt_hours(item.hours_to_close)),
                "- Notes:",
            ]
        )
        for note in item.notes[:5]:
            lines.append("  - {}".format(note))
        lines.append("")

    md_path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def _fmt_price(value):
    if value is None:
        return "n/a"
    return "{:.4f}".format(value)


def _fmt_hours(value):
    if value is None:
        return "n/a"
    return "{:.1f}".format(value)
