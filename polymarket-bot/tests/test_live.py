import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

from polymarket_bot.config import load_config
from polymarket_bot.live import build_dry_run_orders, validate_live_setup
from polymarket_bot.models import MarketSnapshot, Opportunity


class LiveWorkflowTests(unittest.TestCase):
    def test_validate_live_setup_reports_missing_keys(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            root = Path(tmpdir)
            (root / ".env").write_text("ALLOW_LIVE_TRADING=false\n", encoding="utf-8")
            config = load_config(root)

            result = validate_live_setup(root, config)

            self.assertFalse(result["ready_for_live_orders"])
            self.assertIn("PRIVATE_KEY", result["missing_required"])
            self.assertTrue((root / "reports" / "live_readiness.json").exists())

    def test_build_dry_run_orders_writes_actionable_order(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            root = Path(tmpdir)
            config = load_config(root)
            market = MarketSnapshot(
                question="Will candidate win?",
                slug="candidate-market",
                yes_token_id="yes-token",
                no_token_id="no-token",
                yes_price=0.61,
                no_price=0.39,
                volume=50000.0,
                liquidity=75000.0,
                end_date=datetime.now(timezone.utc) + timedelta(days=10),
                description="",
                category="World Elections",
                active=True,
                closed=False,
                enable_order_book=True,
            )
            opportunity = Opportunity(
                question=market.question,
                slug=market.slug,
                action="BUY_YES",
                market_price=0.61,
                fair_price=0.67,
                edge=0.06,
                size_usd=25.0,
                confidence=0.7,
                quality_score=0.9,
                liquidity=75000.0,
                volume=50000.0,
                hours_to_close=240.0,
                yes_ask=0.61,
                no_ask=0.39,
                notes=["Looks good."],
            )

            result = build_dry_run_orders(config.reports_dir, config, [market], [opportunity], max_orders=1)

            self.assertEqual(len(result["orders"]), 1)
            self.assertEqual(result["orders"][0]["token_id"], "yes-token")
            self.assertTrue((config.reports_dir / "latest_dry_run_orders.json").exists())
