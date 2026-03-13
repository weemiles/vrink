import json
from pathlib import Path
from typing import Dict

from .models import ManualSignal


def load_manual_signals(path: Path) -> Dict[str, ManualSignal]:
    if not path.exists():
        return {}

    payload = json.loads(path.read_text(encoding="utf-8"))
    entries = payload.get("markets", []) if isinstance(payload, dict) else []

    signals: Dict[str, ManualSignal] = {}
    for raw in entries:
        slug = (raw.get("slug") or raw.get("market_slug") or "").strip()
        fair_yes = raw.get("fair_yes_probability")
        rationale = (raw.get("rationale") or "").strip()
        notes = raw.get("notes") or []
        if not slug or fair_yes is None:
            continue

        signals[slug] = ManualSignal(
            slug=slug,
            fair_yes_probability=float(fair_yes),
            rationale=rationale,
            notes=[str(note) for note in notes],
        )
    return signals
