import argparse
import json
import sys
from pathlib import Path

from .app import ResearchBotApp


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="Polymarket research and paper-trading bot")
    subparsers = parser.add_subparsers(dest="command", required=True)

    scan_parser = subparsers.add_parser("scan", help="Fetch markets and write a ranked report")
    scan_parser.add_argument("--top", type=int, default=10, help="Number of rows to print to stdout")

    paper_parser = subparsers.add_parser("paper", help="Run the paper-trading cycle")
    paper_parser.add_argument("--top", type=int, default=10, help="Number of rows to print to stdout")
    paper_parser.add_argument("--once", action="store_true", help="Run a single cycle and exit")

    args = parser.parse_args(argv)
    project_root = Path(__file__).resolve().parent.parent
    app = ResearchBotApp(project_root)

    if args.command == "scan":
        opportunities, fills = app.scan_once()
        _print_rows(opportunities, args.top)
        _print_footer(fills)
        return 0

    if args.command == "paper":
        if args.once:
            opportunities, fills = app.paper_once()
            _print_rows(opportunities, args.top)
            _print_footer(fills)
            return 0
        app.loop_paper()
        return 0

    parser.print_help()
    return 1


def _print_rows(opportunities, top: int) -> None:
    print(json.dumps(opportunities[:top], indent=2, ensure_ascii=True))


def _print_footer(fills) -> None:
    print(json.dumps({"paper_fills": fills}, indent=2, ensure_ascii=True))


if __name__ == "__main__":
    sys.exit(main())
