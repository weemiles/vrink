import unittest

from polymarket_bot.gamma import GammaClient


class GammaClientTests(unittest.TestCase):
    def test_parse_event_flattens_only_open_markets(self):
        client = GammaClient("https://gamma-api.polymarket.com")
        event = {
            "description": "Event level description",
            "tags": [{"label": "Crypto"}],
            "markets": [
                {
                    "question": "Open market?",
                    "slug": "open-market",
                    "clobTokenIds": "[\"yes\", \"no\"]",
                    "outcomePrices": "[\"0.48\", \"0.52\"]",
                    "volume24hr": 1234.5,
                    "liquidityNum": 4321.0,
                    "endDate": "2026-06-01T00:00:00Z",
                    "active": True,
                    "closed": False,
                    "enableOrderBook": True,
                    "acceptingOrders": True,
                },
                {
                    "question": "Closed market?",
                    "slug": "closed-market",
                    "clobTokenIds": "[\"yes2\", \"no2\"]",
                    "active": True,
                    "closed": True,
                    "enableOrderBook": True,
                },
            ],
        }

        parsed = client._parse_event(event)

        self.assertEqual(len(parsed), 1)
        self.assertEqual(parsed[0].slug, "open-market")
        self.assertEqual(parsed[0].category, "Crypto")
        self.assertEqual(parsed[0].description, "Event level description")
        self.assertEqual(parsed[0].volume, 1234.5)
        self.assertEqual(parsed[0].liquidity, 4321.0)
