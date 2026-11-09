"""値の書き方（/ でつなぐ・〜・小数・%）。"""

from decimal import ROUND_HALF_UP, Decimal

from .stats import RATIO_STAT_LABELS
from .values import Series, StatTerm, Unsolvable, Value

RANK_SEPARATOR = "/"
RANGE_SEPARATOR = "〜"


def format_number(number: float) -> str:
    """小数第 2 位で四捨五入し、末尾の 0 と `.` を取る（9.50 → 9.5）。

    float32 由来の誤差（0.4000000059604645）を消すため、先に 6 桁に丸める。
    """
    exact = Decimal(repr(round(number, 6)))
    rounded = exact.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    text = format(rounded, "f")
    if "." in text:
        text = text.rstrip("0").rstrip(".")
    return "0" if text in ("", "-0") else text


def format_series(series: Series) -> str:
    """ランクごとなら `/` でつなぎ、レベルごとなら `最小〜最大`。全部同じなら 1 つ。"""
    texts = [format_number(v) for v in series.values]
    if series.by_level:
        # 小さい順には並べ替えない（短くなるクールダウンは 30〜2.5）
        texts = [format_number(series.values[0]), format_number(series.values[-1])]
        separator = RANGE_SEPARATOR
    else:
        separator = RANK_SEPARATOR
    if len(set(texts)) == 1:
        return texts[0]
    return separator.join(texts)


def _scaled(series: Series, factor: float) -> Series:
    return Series(tuple(v * factor for v in series.values), series.by_level)


def format_percent(series: Series) -> str:
    """割合（0.7）を `70%` の形にする。"""
    return format_series(_scaled(series, 100)) + "%"


def _format_term(term: StatTerm, percent: bool) -> str:
    """増える分 1 つ。percent は値が `%` 表示のとき（係数は既に ×100 されている）。"""
    unit = "%" if percent else ""
    if term.per_stack:
        return f"1スタックにつき{format_series(term.coefficient)}{unit}"
    if percent and term.label in RATIO_STAT_LABELS:
        # ステータスの 1.0 が 100%。係数は 1.0 あたりに増える % のまま
        return f"{term.label}100%ごとに{format_series(term.coefficient)}%"
    if percent:
        per_100 = format_series(_scaled(term.coefficient, 100))
        return f"{term.label}100ごとに{per_100}%"
    return f"{term.label}の{format_percent(term.coefficient)}"


def format_value(value: Value) -> str:
    """値を文字にする。

    例: `25/70/115/160/205 (+攻撃力の70%)`、`25% (+魔力100ごとに4%)`、
    `10 (+1スタックにつき2)`。
    """
    terms = [_format_term(t, value.percent) for t in value.terms]
    if value.base is None:
        if not terms:
            raise Unsolvable("空の値")
        return " +".join(terms)
    text = format_series(value.base) + ("%" if value.percent else "")
    if terms:
        text += " (+" + " +".join(terms) + ")"
    return text
