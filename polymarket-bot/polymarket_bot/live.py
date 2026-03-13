import importlib.util
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Sequence

from .config import BotConfig
from .models import MarketSnapshot, Opportunity


def validate_live_setup(project_root: Path, config: BotConfig) -> Dict[str, object]:
    env_values = _read_dotenv(project_root / ".env")
    py_clob_client_installed = importlib.util.find_spec("py_clob_client") is not None

    presence = {
        "ALLOW_LIVE_TRADING": config.allow_live_trading,
        "PRIVATE_KEY": bool(env_values.get("PRIVATE_KEY")),
        "FUNDER_ADDRESS": bool(env_values.get("FUNDER_ADDRESS")),
        "POLY_API_KEY": bool(env_values.get("POLY_API_KEY")),
        "POLY_PASSPHRASE": bool(env_values.get("POLY_PASSPHRASE")),
        "POLY_API_SECRET": bool(env_values.get("POLY_API_SECRET")),
    }

    missing_required = [
        key
        for key in ["PRIVATE_KEY", "POLY_API_KEY", "POLY_PASSPHRASE", "POLY_API_SECRET"]
        if not presence[key]
    ]

    warnings: List[str] = []
    if not config.allow_live_trading:
        warnings.append("ALLOW_LIVE_TRADING is false, so live orders are still disabled.")
    if not py_clob_client_installed:
        warnings.append("py-clob-client is not installed yet.")
    if not presence["FUNDER_ADDRESS"]:
        warnings.append(
            "FUNDER_ADDRESS is blank. This is commonly needed for custodial/email/social Polymarket wallets and may also be used in some signer setups."
        )

    ready_for_live_orders = (
        config.allow_live_trading
        and py_clob_client_installed
        and not missing_required
    )

    result = {
        "checked_at": datetime.now(timezone.utc).isoformat(),
        "allow_live_trading": config.allow_live_trading,
        "py_clob_client_installed": py_clob_client_installed,
        "env_presence": presence,
        "missing_required": missing_required,
        "warnings": warnings,
        "ready_for_live_orders": ready_for_live_orders,
        "next_steps": _next_steps(presence, py_clob_client_installed, config.allow_live_trading),
    }

    reports_path = config.reports_dir / "live_readiness.json"
    reports_path.write_text(json.dumps(result, indent=2, ensure_ascii=True) + "\n", encoding="utf-8")
    result["report_path"] = str(reports_path)
    return result


def build_dry_run_orders(
    reports_dir: Path,
    config: BotConfig,
    markets: Sequence[MarketSnapshot],
    opportunities: Sequence[Opportunity],
    max_orders: int = 3,
) -> Dict[str, object]:
    market_lookup = {market.slug: market for market in markets}
    orders: List[Dict[str, object]] = []

    actionable = [item for item in opportunities if item.action.startswith("BUY")]
    for opportunity in actionable[:max_orders]:
        market = market_lookup.get(opportunity.slug)
        if market is None:
            continue
        side = "YES" if opportunity.action == "BUY_YES" else "NO"
        token_id = market.yes_token_id if side == "YES" else market.no_token_id
        limit_price = opportunity.yes_ask if side == "YES" else opportunity.no_ask
        if limit_price is None or limit_price <= 0.0:
            continue

        order = {
            "created_at": datetime.now(timezone.utc).isoformat(),
            "slug": opportunity.slug,
            "question": opportunity.question,
            "side": side,
            "token_id": token_id,
            "limit_price": round(limit_price, 4),
            "size_usd": round(opportunity.size_usd, 2),
            "shares": round(opportunity.size_usd / limit_price, 4),
            "fair_price": opportunity.fair_price,
            "edge_bps": round(opportunity.edge * 10000.0, 1),
            "confidence": opportunity.confidence,
            "quality_score": opportunity.quality_score,
            "hours_to_close": opportunity.hours_to_close,
            "liquidity": opportunity.liquidity,
            "volume": opportunity.volume,
            "order_type": "GTC",
            "status": "dry_run_only",
            "risk_checks": _risk_checks(config, opportunity),
            "notes": opportunity.notes[:8],
        }
        orders.append(order)

    result = {
        "created_at": datetime.now(timezone.utc).isoformat(),
        "market_count": len(markets),
        "actionable_count": len(actionable),
        "max_orders": max_orders,
        "orders": orders,
    }

    output_path = reports_dir / "latest_dry_run_orders.json"
    output_path.write_text(json.dumps(result, indent=2, ensure_ascii=True) + "\n", encoding="utf-8")
    result["report_path"] = str(output_path)
    return result


def _risk_checks(config: BotConfig, opportunity: Opportunity) -> List[str]:
    checks: List[str] = []
    if opportunity.edge < config.min_edge_probability:
        checks.append("Edge is below configured entry threshold.")
    if opportunity.size_usd > config.bankroll_usd * config.max_position_pct:
        checks.append("Position size exceeds configured max_position_pct.")
    if opportunity.hours_to_close is not None and opportunity.hours_to_close < config.min_hours_to_close:
        checks.append("Market resolves sooner than the configured minimum.")
    if opportunity.yes_ask is not None and opportunity.no_ask is not None:
        if ((opportunity.yes_ask + opportunity.no_ask) - 1.0) > 0.03:
            checks.append("Combined YES/NO ask prices imply a wide effective spread.")
    if not checks:
        checks.append("Passed configured dry-run risk checks.")
    return checks


def _next_steps(presence: Dict[str, bool], py_clob_client_installed: bool, allow_live_trading: bool) -> List[str]:
    steps: List[str] = []
    if not presence["PRIVATE_KEY"]:
        steps.append("Export or create the private key you will use for signing.")
    if not presence["FUNDER_ADDRESS"]:
        steps.append("If your wallet is custodial or Magic/social based, add FUNDER_ADDRESS to .env.")
    if not (presence["POLY_API_KEY"] and presence["POLY_PASSPHRASE"] and presence["POLY_API_SECRET"]):
        steps.append("Generate or copy your Polymarket L2 API credentials into .env.")
    if not py_clob_client_installed:
        steps.append("Install py-clob-client locally before enabling live execution.")
    if not allow_live_trading:
        steps.append("Keep ALLOW_LIVE_TRADING=false until dry runs look correct, then flip it deliberately.")
    if not steps:
        steps.append("Live prerequisites look complete. Keep using dry-run until you are ready to wire the execution adapter.")
    return steps


def _read_dotenv(path: Path) -> Dict[str, str]:
    values: Dict[str, str] = {}
    if not path.exists():
        return values

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip().strip("'").strip('"')
    return values
