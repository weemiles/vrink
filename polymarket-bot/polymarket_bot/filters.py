from dataclasses import dataclass
from typing import List, Optional, Sequence, Tuple

from .models import MarketSnapshot, Opportunity


SPORTS_KEYWORDS = {
    "soccer",
    "football",
    "fifa",
    "premier league",
    "champions league",
    "nba",
    "wnba",
    "nfl",
    "mlb",
    "nhl",
    "baseball",
    "basketball",
    "tennis",
    "golf",
    "cricket",
    "ufc",
    "mma",
    "boxing",
}

WORLD_POLITICS_KEYWORDS = {
    "world elections",
    "election",
    "presidential",
    "prime minister",
    "parliament",
    "coalition",
    "government",
    "cabinet",
    "ceasefire",
    "ukraine",
    "russia",
    "china",
    "taiwan",
    "nato",
    "gaza",
    "israel",
    "iran",
    "syria",
    "turkey",
    "hungary",
    "colombian",
    "president",
}


@dataclass(frozen=True)
class ScanFilters:
    focus: Tuple[str, ...] = ()
    categories: Tuple[str, ...] = ()
    max_hours_to_close: Optional[float] = None
    min_hours_to_close: Optional[float] = None


def build_scan_filters(
    focus: Optional[str] = None,
    categories: Optional[str] = None,
    max_hours_to_close: Optional[float] = None,
    min_hours_to_close: Optional[float] = None,
) -> ScanFilters:
    return ScanFilters(
        focus=_split_csv(focus),
        categories=_split_csv(categories),
        max_hours_to_close=max_hours_to_close,
        min_hours_to_close=min_hours_to_close,
    )


def apply_scan_filters(
    markets: Sequence[MarketSnapshot],
    opportunities: Sequence[Opportunity],
    filters: ScanFilters,
) -> Tuple[List[MarketSnapshot], List[Opportunity]]:
    if not _has_filters(filters):
        return list(markets), list(opportunities)

    market_lookup = {market.slug: market for market in markets}
    filtered_opportunities: List[Opportunity] = []
    filtered_slugs = set()

    for opportunity in opportunities:
        market = market_lookup.get(opportunity.slug)
        if market is None:
            continue
        if not _matches_filters(market, opportunity, filters):
            continue
        filtered_opportunities.append(opportunity)
        filtered_slugs.add(opportunity.slug)

    filtered_markets = [market for market in markets if market.slug in filtered_slugs]
    return filtered_markets, filtered_opportunities


def _matches_filters(market: MarketSnapshot, opportunity: Opportunity, filters: ScanFilters) -> bool:
    if filters.focus and not any(_matches_focus(market, focus) for focus in filters.focus):
        return False

    if filters.categories:
        category = (market.category or "").lower()
        if not any(term in category for term in filters.categories):
            return False

    if filters.max_hours_to_close is not None:
        if opportunity.hours_to_close is None or opportunity.hours_to_close > filters.max_hours_to_close:
            return False

    if filters.min_hours_to_close is not None:
        if opportunity.hours_to_close is None or opportunity.hours_to_close < filters.min_hours_to_close:
            return False

    return True


def _matches_focus(market: MarketSnapshot, focus: str) -> bool:
    normalized_focus = focus.lower()
    haystack = " ".join(
        part for part in [market.category or "", market.question or "", market.description or ""] if part
    ).lower()

    if normalized_focus == "sports":
        return any(keyword in haystack for keyword in SPORTS_KEYWORDS)

    if normalized_focus in {"world-politics", "geopolitics", "world-political"}:
        return any(keyword in haystack for keyword in WORLD_POLITICS_KEYWORDS)

    return normalized_focus in haystack


def _has_filters(filters: ScanFilters) -> bool:
    return bool(
        filters.focus
        or filters.categories
        or filters.max_hours_to_close is not None
        or filters.min_hours_to_close is not None
    )


def _split_csv(value: Optional[str]) -> Tuple[str, ...]:
    if not value:
        return ()
    return tuple(part.strip().lower() for part in value.split(",") if part.strip())
