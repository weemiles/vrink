import json
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

from polymarket_bot.models import MarketSnapshot, Opportunity
from polymarket_bot.research import compile_research_signals, prepare_research_packets


class ResearchWorkflowTests(unittest.TestCase):
    def test_prepare_research_packets_creates_files(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            research_dir = Path(tmpdir) / "research"
            research_dir.mkdir()
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
            opportunity = Opportunity(
                question="Will example happen?",
                slug="example-market",
                action="REVIEW",
                market_price=0.55,
                fair_price=None,
                edge=0.0,
                size_usd=0.0,
                confidence=0.3,
                quality_score=0.8,
                liquidity=75000.0,
                volume=100000.0,
                hours_to_close=72.0,
                yes_ask=0.56,
                no_ask=0.44,
                notes=["No manual fair-value signal exists yet."],
            )

            created = prepare_research_packets(research_dir, [market], [opportunity], limit=1)

            self.assertEqual(len(created), 1)
            self.assertTrue((research_dir / "example-market" / "brief.md").exists())
            self.assertTrue((research_dir / "example-market" / "thesis.json").exists())

    def test_compile_research_signals_writes_ready_dossiers(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            root = Path(tmpdir)
            research_dir = root / "research"
            market_dir = research_dir / "example-market"
            market_dir.mkdir(parents=True)
            thesis = {
                "slug": "example-market",
                "status": "ready",
                "fair_yes_probability": 0.61,
                "confidence": 0.7,
                "rationale": "Research says market is slightly underpricing YES.",
                "sources": ["https://example.com/source"],
            }
            (market_dir / "thesis.json").write_text(json.dumps(thesis), encoding="utf-8")

            output_path = root / "manual_signals.json"
            result = compile_research_signals(research_dir, output_path)
            payload = json.loads(output_path.read_text(encoding="utf-8"))

            self.assertEqual(result["written"], ["example-market"])
            self.assertEqual(payload["markets"][0]["slug"], "example-market")
            self.assertEqual(payload["markets"][0]["fair_yes_probability"], 0.61)
