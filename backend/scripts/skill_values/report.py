"""解けた数の集計と、実行の最後に出す表示。"""

from collections import Counter
from dataclasses import dataclass, field

SLOT_NAMES = ("パッシブ", "Q", "W", "E", "R")
TOP_REASONS = 20


@dataclass
class Tally:
    """スロット（パッシブ・Q・W・E・R）ごとの、解けた数と全体の数。"""

    solved: Counter[str] = field(default_factory=Counter)
    total: Counter[str] = field(default_factory=Counter)
    reasons: Counter[str] = field(default_factory=Counter)

    def add(self, slot: str, text: str | None) -> None:
        self.total[slot] += 1
        if text is not None:
            self.solved[slot] += 1

    def add_reason(self, reason: str) -> None:
        self.reasons[reason] += 1

    @property
    def solved_all(self) -> int:
        return sum(self.solved.values())

    @property
    def total_all(self) -> int:
        return sum(self.total.values())


def _ratio(solved: int, total: int) -> str:
    percent = 100 * solved / total if total else 0.0
    return f"{solved}/{total} ({percent:.1f}%)"


def format_report(tally: Tally) -> str:
    """集計の表示。解けた数と割合（全体・パッシブ・スキル別）と、解けなかった理由の上位。"""
    lines = [f"解けたスキル: {_ratio(tally.solved_all, tally.total_all)}"]
    for slot in SLOT_NAMES:
        lines.append(f"  {slot}: {_ratio(tally.solved[slot], tally.total[slot])}")
    lines.append(f"解けなかった理由の上位{TOP_REASONS}:")
    for reason, count in sorted(
        tally.reasons.items(), key=lambda item: (-item[1], item[0])
    )[:TOP_REASONS]:
        lines.append(f"  {count:4d}  {reason}")
    return "\n".join(lines)
