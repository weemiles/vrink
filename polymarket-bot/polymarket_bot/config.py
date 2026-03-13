from dataclasses import dataclass
from pathlib import Path
from typing import Optional

from .env import env_bool, env_float, env_int, env_str, load_env_file


@dataclass(frozen=True)
class BotConfig:
    project_root: Path
    gamma_base_url: str
    clob_base_url: str
    market_limit: int
    market_order: str
    tag_id: Optional[int]
    min_liquidity_usd: float
    min_volume_usd: float
    max_spread_cents: float
    min_hours_to_close: float
    min_edge_bps: float
    bankroll_usd: float
    max_position_pct: float
    scan_interval_seconds: int
    manual_signals_path: Path
    reports_dir: Path
    allow_live_trading: bool

    @property
    def min_edge_probability(self) -> float:
        return self.min_edge_bps / 10000.0


def load_config(project_root: Path) -> BotConfig:
    load_env_file(project_root / ".env")

    tag_id_raw = env_str("TAG_ID")
    tag_id = int(tag_id_raw) if tag_id_raw else None

    manual_signals = _resolve_path(project_root, env_str("MANUAL_SIGNALS_PATH", "manual_signals.json"))
    reports_dir = _resolve_path(project_root, env_str("REPORTS_DIR", "reports"))
    reports_dir.mkdir(parents=True, exist_ok=True)

    return BotConfig(
        project_root=project_root,
        gamma_base_url=env_str("GAMMA_BASE_URL", "https://gamma-api.polymarket.com") or "",
        clob_base_url=env_str("CLOB_BASE_URL", "https://clob.polymarket.com") or "",
        market_limit=env_int("MARKET_LIMIT", 75),
        market_order=env_str("MARKET_ORDER", "volume_24hr") or "volume_24hr",
        tag_id=tag_id,
        min_liquidity_usd=env_float("MIN_LIQUIDITY_USD", 15000.0),
        min_volume_usd=env_float("MIN_VOLUME_USD", 25000.0),
        max_spread_cents=env_float("MAX_SPREAD_CENTS", 6.0),
        min_hours_to_close=env_float("MIN_HOURS_TO_CLOSE", 8.0),
        min_edge_bps=env_float("MIN_EDGE_BPS", 400.0),
        bankroll_usd=env_float("BANKROLL_USD", 1000.0),
        max_position_pct=env_float("MAX_POSITION_PCT", 0.03),
        scan_interval_seconds=env_int("SCAN_INTERVAL_SECONDS", 300),
        manual_signals_path=manual_signals,
        reports_dir=reports_dir,
        allow_live_trading=env_bool("ALLOW_LIVE_TRADING", False),
    )


def _resolve_path(project_root: Path, raw_path: str) -> Path:
    path = Path(raw_path)
    if path.is_absolute():
        return path
    return project_root / path
