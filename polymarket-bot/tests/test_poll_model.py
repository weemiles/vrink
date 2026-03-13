import json
import tempfile
import unittest
from pathlib import Path

from polymarket_bot.poll_model import run_poll_model


class PollModelTests(unittest.TestCase):
    def test_run_poll_model_computes_probability_and_updates_thesis(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            root = Path(tmpdir)
            thesis_path = root / "thesis.json"
            thesis_path.write_text(
                json.dumps(
                    {
                        "slug": "example-market",
                        "fair_yes_probability": None,
                        "confidence": None,
                        "updated_at": "2026-03-13T00:00:00+00:00",
                    }
                ),
                encoding="utf-8",
            )
            config_path = root / "poll_model.json"
            config_path.write_text(
                json.dumps(
                    {
                        "market_slug": "example-market",
                        "candidate_name": "Candidate A",
                        "opponent_name": "Candidate B",
                        "as_of": "2026-03-13T00:00:00+00:00",
                        "election_date": "2026-04-12T00:00:00+00:00",
                        "thesis_path": str(thesis_path),
                        "adjustments": {
                            "incumbency_points": -2.0,
                            "system_points": -1.0,
                            "late_campaign_risk_points": -0.5
                        },
                        "polls": [
                            {
                                "pollster": "Poll A",
                                "field_date_end": "2026-03-06T00:00:00+00:00",
                                "candidate_support": 38,
                                "opponent_support": 30,
                                "population": "all_voters",
                                "sample_size": None,
                                "quality": 1.0,
                                "source": "https://example.com/a"
                            },
                            {
                                "pollster": "Poll B",
                                "field_date_end": "2026-02-28T00:00:00+00:00",
                                "candidate_support": 38,
                                "opponent_support": 32,
                                "population": "all_voters",
                                "sample_size": None,
                                "quality": 0.95,
                                "source": "https://example.com/b"
                            }
                        ]
                    }
                ),
                encoding="utf-8",
            )

            result = run_poll_model(config_path, write_thesis=True)
            thesis = json.loads(thesis_path.read_text(encoding="utf-8"))

            self.assertGreater(result["fair_yes_probability"], 0.6)
            self.assertIn("poll_model_output", thesis)
            self.assertEqual(thesis["fair_yes_probability"], result["fair_yes_probability"])
