import json
import time
from pathlib import Path
from typing import List, Optional, Tuple

from .clob import ClobMarketDataClient
from .config import BotConfig, load_config
from .filters import ScanFilters, apply_scan_filters
from .gamma import GammaClient
from .paper import PaperTrader
from .report import write_report
from .research import compile_research_signals, prepare_research_packets
from .signals import load_manual_signals
from .strategy import ResearchStrategy


class ResearchBotApp:
    def __init__(self, project_root: Path) -> None:
        self.config = load_config(project_root)
        self.gamma = GammaClient(self.config.gamma_base_url)
        self.clob = ClobMarketDataClient(self.config.clob_base_url)
        self.strategy = ResearchStrategy(self.config)
        self.paper = PaperTrader(self.config.reports_dir, self.config.bankroll_usd)

    def scan_once(
        self,
        filters: ScanFilters = ScanFilters(),
        fetch_limit: Optional[int] = None,
    ) -> Tuple[List[dict], List[dict]]:
        opportunities, fills = self._run_cycle(
            execute_paper=False,
            filters=filters,
            fetch_limit=fetch_limit,
        )
        return [item.to_dict() for item in opportunities], fills

    def paper_once(
        self,
        filters: ScanFilters = ScanFilters(),
        fetch_limit: Optional[int] = None,
    ) -> Tuple[List[dict], List[dict]]:
        opportunities, fills = self._run_cycle(
            execute_paper=True,
            filters=filters,
            fetch_limit=fetch_limit,
        )
        return [item.to_dict() for item in opportunities], fills

    def prepare_research(
        self,
        limit: int,
        overwrite: bool = False,
        filters: ScanFilters = ScanFilters(),
        fetch_limit: Optional[int] = None,
    ) -> List[dict]:
        markets, opportunities = self._scan_objects(filters=filters, fetch_limit=fetch_limit)
        packets = prepare_research_packets(
            research_dir=self.config.research_dir,
            markets=markets,
            opportunities=opportunities,
            limit=limit,
            overwrite=overwrite,
        )
        write_report(self.config.reports_dir, opportunities, fills=[])
        return packets

    def compile_research(self) -> dict:
        return compile_research_signals(
            research_dir=self.config.research_dir,
            output_path=self.config.manual_signals_path,
        )

    def loop_paper(
        self,
        filters: ScanFilters = ScanFilters(),
        fetch_limit: Optional[int] = None,
    ) -> None:
        while True:
            opportunities, fills = self._run_cycle(
                execute_paper=True,
                filters=filters,
                fetch_limit=fetch_limit,
            )
            print(
                json.dumps(
                    {
                        "timestamp": time.time(),
                        "actionable": sum(1 for item in opportunities if item.action.startswith("BUY")),
                        "fills": len(fills),
                    },
                    ensure_ascii=True,
                )
            )
            time.sleep(self.config.scan_interval_seconds)

    def _run_cycle(
        self,
        execute_paper: bool,
        filters: ScanFilters = ScanFilters(),
        fetch_limit: Optional[int] = None,
    ):
        markets, opportunities = self._scan_objects(filters=filters, fetch_limit=fetch_limit)
        fills = self.paper.execute(opportunities) if execute_paper else []
        write_report(self.config.reports_dir, opportunities, fills)
        return opportunities, fills

    def _scan_objects(
        self,
        filters: ScanFilters = ScanFilters(),
        fetch_limit: Optional[int] = None,
    ):
        markets = self.gamma.fetch_markets(
            limit=fetch_limit or self.config.market_limit,
            order=self.config.market_order,
            tag_id=self.config.tag_id,
        )
        token_ids = [token_id for market in markets for token_id in (market.yes_token_id, market.no_token_id)]
        books = self.clob.fetch_books(token_ids)
        signals = load_manual_signals(self.config.manual_signals_path)
        opportunities = self.strategy.evaluate(markets, books, signals)
        markets, opportunities = apply_scan_filters(markets, opportunities, filters)
        return markets, opportunities
