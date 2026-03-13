from datetime import datetime, timezone
from typing import Dict, Iterable, List, Optional

from .config import BotConfig
from .models import ManualSignal, MarketSnapshot, Opportunity, OrderBookSummary


class ResearchStrategy:
    def __init__(self, config: BotConfig) -> None:
        self.config = config

    def evaluate(
        self,
        markets: Iterable[MarketSnapshot],
        books: Dict[str, OrderBookSummary],
        signals: Dict[str, ManualSignal],
    ) -> List[Opportunity]:
        now = datetime.now(timezone.utc)
        opportunities = [
            self._evaluate_market(market, books, signals.get(market.slug), now)
            for market in markets
        ]
        return sorted(
            opportunities,
            key=lambda item: (
                0 if item.action.startswith("BUY") else 1,
                -(item.edge * max(item.quality_score, 0.1)),
                item.market_price if item.market_price is not None else 99.0,
            ),
        )

    def _evaluate_market(
        self,
        market: MarketSnapshot,
        books: Dict[str, OrderBookSummary],
        signal: Optional[ManualSignal],
        now: datetime,
    ) -> Opportunity:
        notes: List[str] = []
        yes_book = books.get(market.yes_token_id)
        no_book = books.get(market.no_token_id)

        yes_ask = _first_defined(yes_book.best_ask if yes_book else None, market.yes_price)
        no_ask = _first_defined(no_book.best_ask if no_book else None, market.no_price)
        yes_spread = yes_book.spread if yes_book else None
        no_spread = no_book.spread if no_book else None
        market_spread = _first_defined(yes_spread, no_spread, 1.0)
        hours_to_close = market.hours_to_close(now)

        if not market.active or market.closed or not market.enable_order_book:
            notes.append("Market is not open for order-book trading.")
            return _pass_opportunity(market, notes, hours_to_close, yes_ask, no_ask)

        if market.liquidity < self.config.min_liquidity_usd:
            notes.append(
                "Liquidity ${:,.0f} is below the ${:,.0f} threshold.".format(
                    market.liquidity, self.config.min_liquidity_usd
                )
            )

        if market.volume < self.config.min_volume_usd:
            notes.append(
                "Volume ${:,.0f} is below the ${:,.0f} threshold.".format(
                    market.volume, self.config.min_volume_usd
                )
            )

        if market_spread is not None and market_spread * 100.0 > self.config.max_spread_cents:
            notes.append(
                "Spread {:.1f}c is wider than the {:.1f}c limit.".format(
                    market_spread * 100.0, self.config.max_spread_cents
                )
            )

        if hours_to_close is not None and hours_to_close < self.config.min_hours_to_close:
            notes.append(
                "Only {:.1f} hours remain before resolution.".format(hours_to_close)
            )

        quality_score = self._quality_score(market, market_spread, hours_to_close)

        if signal is None:
            notes.insert(0, "No manual fair-value signal exists yet, so this stays on the review list.")
            return Opportunity(
                question=market.question,
                slug=market.slug,
                action="REVIEW",
                market_price=yes_ask,
                fair_price=None,
                edge=0.0,
                size_usd=0.0,
                confidence=quality_score * 0.4,
                quality_score=quality_score,
                liquidity=market.liquidity,
                volume=market.volume,
                hours_to_close=hours_to_close,
                yes_ask=yes_ask,
                no_ask=no_ask,
                notes=notes,
            )

        if yes_ask is None or no_ask is None:
            notes.insert(0, "Missing order-book asks, so the market cannot be sized safely.")
            return _pass_opportunity(market, notes, hours_to_close, yes_ask, no_ask)

        fair_yes = max(0.0, min(1.0, signal.fair_yes_probability))
        fair_no = 1.0 - fair_yes
        yes_edge = fair_yes - yes_ask
        no_edge = fair_no - no_ask
        min_edge = self.config.min_edge_probability

        notes.insert(0, signal.rationale or "Manual fair value loaded from manual_signals.json.")
        notes.extend(signal.notes)

        if notes and any(message for message in notes[1:] if "below" in message or "wider" in message or "Only" in message):
            return Opportunity(
                question=market.question,
                slug=market.slug,
                action="PASS",
                market_price=yes_ask,
                fair_price=fair_yes,
                edge=max(yes_edge, no_edge),
                size_usd=0.0,
                confidence=quality_score * 0.3,
                quality_score=quality_score,
                liquidity=market.liquidity,
                volume=market.volume,
                hours_to_close=hours_to_close,
                yes_ask=yes_ask,
                no_ask=no_ask,
                notes=notes,
            )

        if yes_edge >= no_edge and yes_edge >= min_edge:
            size = self._position_size(yes_edge, quality_score, yes_ask)
            notes.append(
                "YES edge {:.2f}c exceeds the {:.2f}c entry threshold.".format(
                    yes_edge * 100.0, min_edge * 100.0
                )
            )
            return Opportunity(
                question=market.question,
                slug=market.slug,
                action="BUY_YES",
                market_price=yes_ask,
                fair_price=fair_yes,
                edge=yes_edge,
                size_usd=size,
                confidence=self._confidence(yes_edge, quality_score),
                quality_score=quality_score,
                liquidity=market.liquidity,
                volume=market.volume,
                hours_to_close=hours_to_close,
                yes_ask=yes_ask,
                no_ask=no_ask,
                notes=notes,
            )

        if no_edge > yes_edge and no_edge >= min_edge:
            size = self._position_size(no_edge, quality_score, no_ask)
            notes.append(
                "NO edge {:.2f}c exceeds the {:.2f}c entry threshold.".format(
                    no_edge * 100.0, min_edge * 100.0
                )
            )
            return Opportunity(
                question=market.question,
                slug=market.slug,
                action="BUY_NO",
                market_price=no_ask,
                fair_price=fair_no,
                edge=no_edge,
                size_usd=size,
                confidence=self._confidence(no_edge, quality_score),
                quality_score=quality_score,
                liquidity=market.liquidity,
                volume=market.volume,
                hours_to_close=hours_to_close,
                yes_ask=yes_ask,
                no_ask=no_ask,
                notes=notes,
            )

        notes.append(
            "Your fair value is close to the market, so the edge is not large enough to trade."
        )
        return Opportunity(
            question=market.question,
            slug=market.slug,
            action="PASS",
            market_price=yes_ask,
            fair_price=fair_yes,
            edge=max(yes_edge, no_edge),
            size_usd=0.0,
            confidence=self._confidence(max(yes_edge, no_edge), quality_score),
            quality_score=quality_score,
            liquidity=market.liquidity,
            volume=market.volume,
            hours_to_close=hours_to_close,
            yes_ask=yes_ask,
            no_ask=no_ask,
            notes=notes,
        )

    def _quality_score(
        self,
        market: MarketSnapshot,
        market_spread: Optional[float],
        hours_to_close: Optional[float],
    ) -> float:
        liquidity_score = min(1.0, market.liquidity / max(self.config.min_liquidity_usd * 2.0, 1.0))
        volume_score = min(1.0, market.volume / max(self.config.min_volume_usd * 2.0, 1.0))

        if market_spread is None:
            spread_score = 0.0
        else:
            spread_limit = max(self.config.max_spread_cents / 100.0, 0.0001)
            spread_score = max(0.0, 1.0 - (market_spread / spread_limit))

        if hours_to_close is None:
            time_score = 0.5
        else:
            time_score = max(0.0, min(1.0, hours_to_close / max(self.config.min_hours_to_close * 3.0, 1.0)))

        score = 0.35 * liquidity_score + 0.30 * volume_score + 0.20 * spread_score + 0.15 * time_score
        return max(0.0, min(1.0, score))

    def _position_size(self, edge: float, quality_score: float, market_price: float) -> float:
        base = self.config.bankroll_usd * self.config.max_position_pct
        edge_factor = min(1.5, max(0.25, edge / max(self.config.min_edge_probability, 0.0001)))
        price_factor = min(1.0, max(0.4, 1.0 - abs(0.5 - market_price)))
        return round(base * quality_score * edge_factor * price_factor, 2)

    def _confidence(self, edge: float, quality_score: float) -> float:
        edge_factor = max(0.0, min(1.0, edge / 0.12))
        return round(max(0.0, min(1.0, (0.6 * quality_score) + (0.4 * edge_factor))), 3)


def _first_defined(*values):
    for value in values:
        if value is not None:
            return value
    return None


def _pass_opportunity(
    market: MarketSnapshot,
    notes: List[str],
    hours_to_close: Optional[float],
    yes_ask: Optional[float],
    no_ask: Optional[float],
) -> Opportunity:
    return Opportunity(
        question=market.question,
        slug=market.slug,
        action="PASS",
        market_price=yes_ask,
        fair_price=None,
        edge=0.0,
        size_usd=0.0,
        confidence=0.0,
        quality_score=0.0,
        liquidity=market.liquidity,
        volume=market.volume,
        hours_to_close=hours_to_close,
        yes_ask=yes_ask,
        no_ask=no_ask,
        notes=notes,
    )
