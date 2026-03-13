import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable, List

from .models import Opportunity, PaperState


class PaperTrader:
    def __init__(self, reports_dir: Path, starting_cash: float) -> None:
        self.state_path = reports_dir / "paper_state.json"
        self.orders_path = reports_dir / "paper_orders.jsonl"
        self.starting_cash = starting_cash

    def execute(self, opportunities: Iterable[Opportunity]) -> List[dict]:
        state = self._load_state()
        fills: List[dict] = []

        for opportunity in opportunities:
            if not opportunity.action.startswith("BUY"):
                continue
            if opportunity.slug in state.open_positions:
                continue
            if opportunity.size_usd <= 0.0 or state.cash_usd < opportunity.size_usd:
                continue
            if opportunity.market_price is None or opportunity.market_price <= 0.0:
                continue

            shares = round(opportunity.size_usd / opportunity.market_price, 4)
            record = {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "slug": opportunity.slug,
                "question": opportunity.question,
                "action": opportunity.action,
                "price": opportunity.market_price,
                "size_usd": opportunity.size_usd,
                "shares": shares,
                "fair_price": opportunity.fair_price,
                "edge": opportunity.edge,
                "confidence": opportunity.confidence,
            }
            fills.append(record)
            state.cash_usd = round(state.cash_usd - opportunity.size_usd, 2)
            state.open_positions[opportunity.slug] = record

        if fills:
            with self.orders_path.open("a", encoding="utf-8") as handle:
                for record in fills:
                    handle.write(json.dumps(record, ensure_ascii=True) + "\n")

        self._save_state(state)
        return fills

    def _load_state(self) -> PaperState:
        if not self.state_path.exists():
            return PaperState(cash_usd=self.starting_cash, open_positions={})

        payload = json.loads(self.state_path.read_text(encoding="utf-8"))
        return PaperState(
            cash_usd=float(payload.get("cash_usd", self.starting_cash)),
            open_positions=dict(payload.get("open_positions", {})),
        )

    def _save_state(self, state: PaperState) -> None:
        self.state_path.write_text(
            json.dumps(state.to_dict(), indent=2, ensure_ascii=True),
            encoding="utf-8",
        )

    def reset(self) -> dict:
        state = PaperState(cash_usd=self.starting_cash, open_positions={})
        self._save_state(state)
        self.orders_path.write_text("", encoding="utf-8")
        return {
            "cash_usd": self.starting_cash,
            "open_positions": {},
            "orders_path": str(self.orders_path),
            "state_path": str(self.state_path),
        }
