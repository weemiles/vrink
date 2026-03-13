import unittest
from datetime import datetime, timedelta, timezone

from polymarket_bot.filters import apply_scan_filters, build_scan_filters
from polymarket_bot.models import MarketSnapshot, Opportunity


class ScanFilterTests(unittest.TestCase):
    def test_focus_and_time_filters_keep_matching_market(self):
        sports_market = MarketSnapshot(
            question="Will Team A win tonight?",
            slug="sports-market",
            yes_token_id="yes1",
            no_token_id="no1",
            yes_price=0.52,
            no_price=0.48,
            volume=50000.0,
            liquidity=25000.0,
            end_date=datetime.now(timezone.utc) + timedelta(hours=24),
            description="NBA game market",
            category="NBA",
            active=True,
            closed=False,
            enable_order_book=True,
        )
        politics_market = MarketSnapshot(
            question="Will candidate X become PM?",
            slug="politics-market",
            yes_token_id="yes2",
            no_token_id="no2",
            yes_price=0.12,
            no_price=0.88,
            volume=50000.0,
            liquidity=25000.0,
            end_date=datetime.now(timezone.utc) + timedelta(hours=300),
            description="World politics market",
            category="World Elections",
            active=True,
            closed=False,
            enable_order_book=True,
        )
        opportunities = [
            Opportunity(
                question=sports_market.question,
                slug=sports_market.slug,
                action="REVIEW",
                market_price=0.52,
                fair_price=None,
                edge=0.0,
                size_usd=0.0,
                confidence=0.3,
                quality_score=0.7,
                liquidity=25000.0,
                volume=50000.0,
                hours_to_close=24.0,
                yes_ask=0.52,
                no_ask=0.48,
                notes=[],
            ),
            Opportunity(
                question=politics_market.question,
                slug=politics_market.slug,
                action="REVIEW",
                market_price=0.12,
                fair_price=None,
                edge=0.0,
                size_usd=0.0,
                confidence=0.3,
                quality_score=0.7,
                liquidity=25000.0,
                volume=50000.0,
                hours_to_close=300.0,
                yes_ask=0.12,
                no_ask=0.88,
                notes=[],
            ),
        ]

        filters = build_scan_filters(focus="sports", max_hours_to_close=72)
        filtered_markets, filtered_opportunities = apply_scan_filters(
            [sports_market, politics_market],
            opportunities,
            filters,
        )

        self.assertEqual([market.slug for market in filtered_markets], ["sports-market"])
        self.assertEqual([item.slug for item in filtered_opportunities], ["sports-market"])
