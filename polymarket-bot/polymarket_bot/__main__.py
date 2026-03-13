import argparse
import json
import sys
from pathlib import Path

from .app import ResearchBotApp
from .filters import build_scan_filters


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="Polymarket research and paper-trading bot")
    subparsers = parser.add_subparsers(dest="command", required=True)

    scan_parser = subparsers.add_parser("scan", help="Fetch markets and write a ranked report")
    scan_parser.add_argument("--top", type=int, default=10, help="Number of rows to print to stdout")
    _add_filter_args(scan_parser)

    paper_parser = subparsers.add_parser("paper", help="Run the paper-trading cycle")
    paper_parser.add_argument("--top", type=int, default=10, help="Number of rows to print to stdout")
    paper_parser.add_argument("--once", action="store_true", help="Run a single cycle and exit")
    _add_filter_args(paper_parser)

    research_parser = subparsers.add_parser(
        "research",
        help="Create structured research packets for top review candidates",
    )
    research_parser.add_argument("--top", type=int, default=8, help="Number of research packets to create")
    research_parser.add_argument("--overwrite", action="store_true", help="Replace existing research files")
    _add_filter_args(research_parser)

    subparsers.add_parser(
        "compile-signals",
        help="Compile ready research dossiers into manual_signals.json",
    )

    args = parser.parse_args(argv)
    project_root = Path(__file__).resolve().parent.parent
    app = ResearchBotApp(project_root)
    filters = build_scan_filters(
        focus=getattr(args, "focus", None),
        categories=getattr(args, "categories", None),
        max_hours_to_close=getattr(args, "max_hours_to_close", None),
        min_hours_to_close=getattr(args, "min_hours_to_close", None),
    )
    fetch_limit = getattr(args, "fetch_limit", None)

    if args.command == "scan":
        opportunities, fills = app.scan_once(filters=filters, fetch_limit=fetch_limit)
        _print_rows(opportunities, args.top)
        _print_footer(fills)
        return 0

    if args.command == "paper":
        if args.once:
            opportunities, fills = app.paper_once(filters=filters, fetch_limit=fetch_limit)
            _print_rows(opportunities, args.top)
            _print_footer(fills)
            return 0
        app.loop_paper(filters=filters, fetch_limit=fetch_limit)
        return 0

    if args.command == "research":
        packets = app.prepare_research(
            limit=args.top,
            overwrite=args.overwrite,
            filters=filters,
            fetch_limit=fetch_limit,
        )
        print(json.dumps({"research_packets": packets}, indent=2, ensure_ascii=True))
        return 0

    if args.command == "compile-signals":
        result = app.compile_research()
        print(json.dumps(result, indent=2, ensure_ascii=True))
        return 0

    parser.print_help()
    return 1


def _print_rows(opportunities, top: int) -> None:
    print(json.dumps(opportunities[:top], indent=2, ensure_ascii=True))


def _print_footer(fills) -> None:
    print(json.dumps({"paper_fills": fills}, indent=2, ensure_ascii=True))


def _add_filter_args(parser) -> None:
    parser.add_argument(
        "--focus",
        type=str,
        default=None,
        help="Comma-separated focus names such as sports or world-politics",
    )
    parser.add_argument(
        "--categories",
        type=str,
        default=None,
        help="Comma-separated category substrings to match against market categories",
    )
    parser.add_argument(
        "--max-hours-to-close",
        type=float,
        default=None,
        help="Only include markets resolving within this many hours",
    )
    parser.add_argument(
        "--min-hours-to-close",
        type=float,
        default=None,
        help="Only include markets with at least this many hours left",
    )
    parser.add_argument(
        "--fetch-limit",
        type=int,
        default=None,
        help="How many raw markets to fetch before local filtering",
    )


if __name__ == "__main__":
    sys.exit(main())
