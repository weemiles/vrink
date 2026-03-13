import json
import time
from pathlib import Path
from typing import List, Tuple

from .clob import ClobMarketDataClient
from .config import BotConfig, load_config
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

    def scan_once(self) -> Tuple[List[dict], List[dict]]:
        opportunities, fills = self._run_cycle(execute_paper=False)
        return [item.to_dict() for item in opportunities], fills

    def paper_once(self) -> Tuple[List[dict], List[dict]]:
        opportunities, fills = self._run_cycle(execute_paper=True)
        return [item.to_dict() for item in opportunities], fills

    def prepare_research(self, limit: int, overwrite: bool = False) -> List[dict]:
        markets, opportunities = self._scan_objects()
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

    def loop_paper(self) -> None:
        while True:
            opportunities, fills = self._run_cycle(execute_paper=True)
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

    def _run_cycle(self, execute_paper: bool):
        markets, opportunities = self._scan_objects()
        fills = self.paper.execute(opportunities) if execute_paper else []
        write_report(self.config.reports_dir, opportunities, fills)
        return opportunities, fills

    def _scan_objects(self):
        markets = self.gamma.fetch_markets(
            limit=self.config.market_limit,
            order=self.config.market_order,
            tag_id=self.config.tag_id,
        )
        token_ids = [token_id for market in markets for token_id in (market.yes_token_id, market.no_token_id)]
        books = self.clob.fetch_books(token_ids)
        signals = load_manual_signals(self.config.manual_signals_path)
        opportunities = self.strategy.evaluate(markets, books, signals)
        return markets, opportunities
