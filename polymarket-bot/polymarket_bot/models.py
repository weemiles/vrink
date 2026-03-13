from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from typing import Dict, List, Optional


@dataclass(frozen=True)
class OrderLevel:
    price: float
    size: float


@dataclass(frozen=True)
class OrderBookSummary:
    token_id: str
    best_bid: Optional[float]
    best_ask: Optional[float]
    last_trade_price: Optional[float]
    tick_size: Optional[str]
    neg_risk: bool = False

    @property
    def mid_price(self) -> Optional[float]:
        if self.best_bid is None and self.best_ask is None:
            return self.last_trade_price
        if self.best_bid is None:
            return self.best_ask
        if self.best_ask is None:
            return self.best_bid
        return (self.best_bid + self.best_ask) / 2.0

    @property
    def spread(self) -> Optional[float]:
        if self.best_bid is None or self.best_ask is None:
            return None
        return max(0.0, self.best_ask - self.best_bid)


@dataclass(frozen=True)
class MarketSnapshot:
    question: str
    slug: str
    yes_token_id: str
    no_token_id: str
    yes_price: Optional[float]
    no_price: Optional[float]
    volume: float
    liquidity: float
    end_date: Optional[datetime]
    description: str
    category: Optional[str]
    active: bool
    closed: bool
    enable_order_book: bool

    def hours_to_close(self, now: Optional[datetime] = None) -> Optional[float]:
        if self.end_date is None:
            return None
        current = now or datetime.now(timezone.utc)
        return (self.end_date - current).total_seconds() / 3600.0


@dataclass(frozen=True)
class ManualSignal:
    slug: str
    fair_yes_probability: float
    rationale: str
    notes: List[str] = field(default_factory=list)


@dataclass(frozen=True)
class Opportunity:
    question: str
    slug: str
    action: str
    market_price: Optional[float]
    fair_price: Optional[float]
    edge: float
    size_usd: float
    confidence: float
    quality_score: float
    liquidity: float
    volume: float
    hours_to_close: Optional[float]
    yes_ask: Optional[float]
    no_ask: Optional[float]
    notes: List[str]

    def to_dict(self) -> Dict[str, object]:
        return asdict(self)


@dataclass
class PaperState:
    cash_usd: float
    open_positions: Dict[str, Dict[str, object]]

    def to_dict(self) -> Dict[str, object]:
        return {"cash_usd": self.cash_usd, "open_positions": self.open_positions}
