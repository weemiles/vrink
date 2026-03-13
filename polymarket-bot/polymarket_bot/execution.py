import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Sequence, Tuple

from .config import BotConfig
from .models import MarketSnapshot, Opportunity


class LiveExecutionError(RuntimeError):
    pass


def derive_api_creds(config: BotConfig, reports_dir: Path) -> Dict[str, object]:
    client, _sdk = _build_authenticated_client(config, allow_missing_creds=True)
    creds = client.create_or_derive_api_creds()
    masked = {
        "key": _mask_secret(creds.get("key")),
        "secret": _mask_secret(creds.get("secret")),
        "passphrase": _mask_secret(creds.get("passphrase")),
    }
    result = {
        "derived_at": datetime.now(timezone.utc).isoformat(),
        "masked_creds": masked,
        "env_fields": {
            "POLY_API_KEY": creds.get("key"),
            "POLY_API_SECRET": creds.get("secret"),
            "POLY_PASSPHRASE": creds.get("passphrase"),
        },
    }
    output_path = reports_dir / "derived_api_creds.masked.json"
    output_path.write_text(
        json.dumps({"derived_at": result["derived_at"], "masked_creds": masked}, indent=2, ensure_ascii=True) + "\n",
        encoding="utf-8",
    )
    result["report_path"] = str(output_path)
    return result


def execute_live_orders(
    config: BotConfig,
    reports_dir: Path,
    markets: Sequence[MarketSnapshot],
    opportunities: Sequence[Opportunity],
    max_orders: int,
    confirm_live: bool,
) -> Dict[str, object]:
    if not confirm_live:
        raise LiveExecutionError("Live execution requires --confirm-live.")
    if not config.allow_live_trading:
        raise LiveExecutionError("ALLOW_LIVE_TRADING is false.")

    client, sdk = _build_authenticated_client(config, allow_missing_creds=False)
    order_args_cls = sdk["OrderArgs"]
    order_type_gtc = sdk["OrderType"].GTC
    buy_constant = sdk["BUY"]

    market_lookup = {market.slug: market for market in markets}
    actionable = [item for item in opportunities if item.action.startswith("BUY")]
    submitted: List[Dict[str, object]] = []

    for opportunity in actionable[:max_orders]:
        market = market_lookup.get(opportunity.slug)
        if market is None:
            continue

        token_id, price, side_name = _select_token_and_price(market, opportunity)
        shares = _shares_for_opportunity(opportunity, price)
        if shares is None:
            continue

        order_request = order_args_cls(
            token_id=token_id,
            price=price,
            size=shares,
            side=buy_constant,
        )
        signed = client.create_order(order_request)
        response = client.post_order(signed, order_type_gtc)
        submitted.append(
            {
                "submitted_at": datetime.now(timezone.utc).isoformat(),
                "slug": opportunity.slug,
                "question": opportunity.question,
                "market_side": side_name,
                "token_id": token_id,
                "price": price,
                "shares": shares,
                "size_usd": round(opportunity.size_usd, 2),
                "response": response,
            }
        )

    result = {
        "submitted_count": len(submitted),
        "orders": submitted,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    output_path = reports_dir / "live_execution_results.json"
    output_path.write_text(json.dumps(result, indent=2, ensure_ascii=True) + "\n", encoding="utf-8")
    result["report_path"] = str(output_path)
    return result


def _build_authenticated_client(config: BotConfig, allow_missing_creds: bool) -> Tuple[object, Dict[str, object]]:
    sdk = _import_sdk()
    clob_client_cls = sdk["ClobClient"]

    if not config.private_key:
        raise LiveExecutionError("PRIVATE_KEY is required.")
    if config.signature_type in {1, 2} and not config.funder_address:
        raise LiveExecutionError("FUNDER_ADDRESS is required for signature_type 1 or 2.")

    client = clob_client_cls(
        config.clob_base_url,
        key=config.private_key,
        chain_id=config.chain_id,
        signature_type=config.signature_type,
        funder=config.funder_address,
    )

    creds = _configured_creds(config)
    if creds is not None:
        client.set_api_creds(creds)
        return client, sdk

    if allow_missing_creds:
        return client, sdk

    client.set_api_creds(client.create_or_derive_api_creds())
    return client, sdk


def _configured_creds(config: BotConfig) -> Optional[Dict[str, str]]:
    if not (config.poly_api_key and config.poly_api_secret and config.poly_passphrase):
        return None
    return {
        "key": config.poly_api_key,
        "secret": config.poly_api_secret,
        "passphrase": config.poly_passphrase,
    }


def _import_sdk() -> Dict[str, object]:
    try:
        from py_clob_client.client import ClobClient
        from py_clob_client.clob_types import OrderArgs, OrderType
        from py_clob_client.order_builder.constants import BUY
    except ImportError as exc:
        raise LiveExecutionError(
            "py-clob-client is not installed. Install it locally before using live execution."
        ) from exc

    return {
        "ClobClient": ClobClient,
        "OrderArgs": OrderArgs,
        "OrderType": OrderType,
        "BUY": BUY,
    }


def _select_token_and_price(market: MarketSnapshot, opportunity: Opportunity) -> Tuple[str, float, str]:
    if opportunity.action == "BUY_YES":
        token_id = market.yes_token_id
        price = opportunity.yes_ask
        side_name = "YES"
    elif opportunity.action == "BUY_NO":
        token_id = market.no_token_id
        price = opportunity.no_ask
        side_name = "NO"
    else:
        raise LiveExecutionError("Only BUY_YES and BUY_NO are supported for live execution.")

    if price is None:
        raise LiveExecutionError("Opportunity is missing a limit price.")
    if price < 0.01 or price > 0.99:
        raise LiveExecutionError("Limit price {} is outside the typical CLOB API range 0.01-0.99.".format(price))
    return token_id, round(price, 4), side_name


def _shares_for_opportunity(opportunity: Opportunity, price: float) -> Optional[float]:
    if opportunity.size_usd <= 0 or price <= 0:
        return None
    return round(opportunity.size_usd / price, 4)


def _mask_secret(value: Optional[str]) -> str:
    if not value:
        return ""
    if len(value) <= 8:
        return "*" * len(value)
    return "{}...{}".format(value[:4], value[-4:])
