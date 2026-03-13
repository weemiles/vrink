import tempfile
import unittest
from pathlib import Path

from polymarket_bot.config import load_config
from polymarket_bot.execution import LiveExecutionError, derive_api_creds


class ExecutionTests(unittest.TestCase):
    def test_derive_api_creds_requires_sdk_and_key(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            root = Path(tmpdir)
            (root / ".env").write_text(
                "ALLOW_LIVE_TRADING=false\nCHAIN_ID=137\nSIGNATURE_TYPE=0\n",
                encoding="utf-8",
            )
            config = load_config(root)

            with self.assertRaises(LiveExecutionError):
                derive_api_creds(config, config.reports_dir)
