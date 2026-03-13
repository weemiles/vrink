from typing import Dict, Iterable, List

from .http import post_json
from .models import OrderBookSummary


class ClobMarketDataClient:
    def __init__(self, base_url: str) -> None:
        self.base_url = base_url.rstrip("/")

    def fetch_books(self, token_ids: Iterable[str], batch_size: int = 100) -> Dict[str, OrderBookSummary]:
        unique = []
        seen = set()
        for token_id in token_ids:
            if not token_id or token_id in seen:
                continue
            seen.add(token_id)
            unique.append(token_id)

        books: Dict[str, OrderBookSummary] = {}
        for start in range(0, len(unique), batch_size):
            batch = unique[start : start + batch_size]
            payload = [{"token_id": token_id} for token_id in batch]
            response = post_json("{}/books".format(self.base_url), payload)
            for item in response:
                summary = _parse_book(item)
                books[summary.token_id] = summary
        return books


def _parse_book(raw: dict) -> OrderBookSummary:
    bids = raw.get("bids") or []
    asks = raw.get("asks") or []
    best_bid = _best_bid(bids)
    best_ask = _best_ask(asks)
    return OrderBookSummary(
        token_id=str(raw.get("asset_id") or raw.get("token_id") or ""),
        best_bid=best_bid,
        best_ask=best_ask,
        last_trade_price=_safe_float(raw.get("last_trade_price")),
        tick_size=raw.get("tick_size"),
        neg_risk=bool(raw.get("neg_risk", False)),
    )


def _best_bid(levels: List[dict]):
    prices = [_safe_float(level.get("price")) for level in levels]
    prices = [price for price in prices if price is not None]
    return max(prices) if prices else None


def _best_ask(levels: List[dict]):
    prices = [_safe_float(level.get("price")) for level in levels]
    prices = [price for price in prices if price is not None]
    return min(prices) if prices else None


def _safe_float(value):
    try:
        if value is None or value == "":
            return None
        return float(value)
    except (TypeError, ValueError):
        return None
