import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from .http import get_json
from .models import MarketSnapshot


class GammaClient:
    def __init__(self, base_url: str) -> None:
        self.base_url = base_url.rstrip("/")

    def fetch_markets(
        self,
        limit: int,
        order: str = "volume_24hr",
        tag_id: Optional[int] = None,
        offset: int = 0,
    ) -> List[MarketSnapshot]:
        params: Dict[str, Any] = {
            "active": "true",
            "closed": "false",
            "limit": limit,
            "offset": offset,
            "order": order,
            "ascending": "false",
        }
        if tag_id is not None:
            params["tag_id"] = tag_id

        payload = get_json("{}/markets".format(self.base_url), params=params)
        return [market for market in (self._parse_market(item) for item in payload) if market]

    def _parse_market(self, raw: Dict[str, Any]) -> Optional[MarketSnapshot]:
        if not raw.get("enableOrderBook", True):
            return None

        token_ids = _ensure_list(raw.get("clobTokenIds"))
        if len(token_ids) < 2:
            return None

        prices = _ensure_list(raw.get("outcomePrices"))
        yes_price = _safe_float(prices[0]) if len(prices) > 0 else _safe_float(raw.get("yesPrice"))
        no_price = _safe_float(prices[1]) if len(prices) > 1 else _safe_float(raw.get("noPrice"))

        return MarketSnapshot(
            question=(raw.get("question") or "").strip(),
            slug=(raw.get("slug") or "").strip(),
            yes_token_id=str(token_ids[0]),
            no_token_id=str(token_ids[1]),
            yes_price=yes_price,
            no_price=no_price,
            volume=_safe_float(raw.get("volume")) or _safe_float(raw.get("volumeNum")) or 0.0,
            liquidity=_safe_float(raw.get("liquidity")) or 0.0,
            end_date=_parse_datetime(raw.get("endDate")),
            description=(raw.get("description") or "").strip(),
            category=_extract_category(raw),
            active=bool(raw.get("active", True)),
            closed=bool(raw.get("closed", False)),
            enable_order_book=bool(raw.get("enableOrderBook", True)),
        )


def _ensure_list(value: Any) -> List[Any]:
    if value is None:
        return []
    if isinstance(value, list):
        return value
    if isinstance(value, str):
        text = value.strip()
        if not text:
            return []
        if text.startswith("["):
            try:
                parsed = json.loads(text)
                return parsed if isinstance(parsed, list) else []
            except json.JSONDecodeError:
                return []
        return [item.strip() for item in text.split(",") if item.strip()]
    return []


def _safe_float(value: Any) -> Optional[float]:
    try:
        if value is None or value == "":
            return None
        return float(value)
    except (TypeError, ValueError):
        return None


def _parse_datetime(value: Any) -> Optional[datetime]:
    if not value or not isinstance(value, str):
        return None
    text = value.strip()
    if text.endswith("Z"):
        text = text[:-1] + "+00:00"
    try:
        dt = datetime.fromisoformat(text)
    except ValueError:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def _extract_category(raw: Dict[str, Any]) -> Optional[str]:
    category = raw.get("category")
    if isinstance(category, str) and category.strip():
        return category.strip()

    tags = raw.get("tags")
    if isinstance(tags, list):
        for tag in tags:
            if isinstance(tag, dict) and tag.get("label"):
                return str(tag["label"]).strip()
            if isinstance(tag, str) and tag.strip():
                return tag.strip()
    return None
