import unittest

from polymarket_bot.clob import _parse_book


class ClobParsingTests(unittest.TestCase):
    def test_best_bid_and_ask_choose_real_top_of_book(self):
        summary = _parse_book(
            {
                "asset_id": "token",
                "bids": [{"price": "0.10"}, {"price": "0.14"}, {"price": "0.12"}],
                "asks": [{"price": "0.99"}, {"price": "0.40"}, {"price": "0.16"}],
                "last_trade_price": "0.14",
            }
        )

        self.assertEqual(summary.best_bid, 0.14)
        self.assertEqual(summary.best_ask, 0.16)
        self.assertAlmostEqual(summary.spread, 0.02)
