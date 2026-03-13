import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

from polymarket_bot.config import load_config
from polymarket_bot.models import ManualSignal, MarketSnapshot, OrderBookSummary
from polymarket_bot.strategy import ResearchStrategy


class StrategyTests(unittest.TestCase):
    def test_buy_yes_when_edge_is_large_and_quality_is_good(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            config = load_config(Path(tmpdir))
            strategy = ResearchStrategy(config)
            market = MarketSnapshot(
                question="Will example happen?",
                slug="example-market",
                yes_token_id="yes",
                no_token_id="no",
                yes_price=0.55,
                no_price=0.45,
                volume=100000.0,
                liquidity=75000.0,
                end_date=datetime.now(timezone.utc) + timedelta(days=3),
                description="",
                category="Politics",
                active=True,
                closed=False,
                enable_order_book=True,
            )
            books = {
                "yes": OrderBookSummary("yes", best_bid=0.55, best_ask=0.57, last_trade_price=0.56, tick_size="0.01"),
                "no": OrderBookSummary("no", best_bid=0.42, best_ask=0.44, last_trade_price=0.43, tick_size="0.01"),
            }
            signals = {
                "example-market": ManualSignal(
                    slug="example-market",
                    fair_yes_probability=0.66,
                    rationale="Outside research says YES is underpriced.",
                    notes=[],
                )
            }

            opportunity = strategy.evaluate([market], books, signals)[0]

        self.assertEqual(opportunity.action, "BUY_YES")
        self.assertGreater(opportunity.size_usd, 0.0)
        self.assertGreater(opportunity.edge, config.min_edge_probability)

    def test_review_when_no_manual_signal_exists(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            config = load_config(Path(tmpdir))
            strategy = ResearchStrategy(config)
            market = MarketSnapshot(
                question="Will example happen?",
                slug="example-market",
                yes_token_id="yes",
                no_token_id="no",
                yes_price=0.55,
                no_price=0.45,
                volume=100000.0,
                liquidity=75000.0,
                end_date=datetime.now(timezone.utc) + timedelta(days=3),
                description="",
                category="Politics",
                active=True,
                closed=False,
                enable_order_book=True,
            )
            books = {
                "yes": OrderBookSummary("yes", best_bid=0.55, best_ask=0.57, last_trade_price=0.56, tick_size="0.01"),
                "no": OrderBookSummary("no", best_bid=0.42, best_ask=0.44, last_trade_price=0.43, tick_size="0.01"),
            }

            opportunity = strategy.evaluate([market], books, signals={})[0]

        self.assertEqual(opportunity.action, "REVIEW")
        self.assertEqual(opportunity.size_usd, 0.0)
