"""mStat・mStatFormula → 日本語のステータス名。

番号は 16.21 の bin.json の計算を、Meraki Analytics の leveling の単位
（`% bonus AD` など）や、そのスキルの文と見比べて確かめた。
mStatFormula は 無し=合計、1=基礎、2=増加。

確かめた番号:
- 0 魔力、1 物理防御、2 攻撃力、6 魔法防御、12 体力: 無し・2 を Meraki の単位
  （`% AP`・`% bonus armor`・`% bonus health` など）と突き合わせた。
  基礎の魔力は 0 なので、(0, 2) も魔力
- 4 攻撃速度（ベルヴェス Q のクールダウン、カイ=サ E の移動速度）、
  7 移動速度（ヘカリムのパッシブ、アウレリオン・ソル W）、
  8 クリティカル率（ケイトリン・アッシュのパッシブ）: スキルの文と計算の形から
- (12, 1) 基礎体力: Meraki との突き合わせは無い。1=基礎の定義から

表に入れない番号:
- 9（クリティカルダメージ）、13〜16（現在の体力・失った体力など）: 他のステータスの
  係数や倍率の中（入れ子）でだけ使われ、単独の「増える分」にならない
- 10、18、29（脅威）、31（射程）: 使う箇所が少なく、ゲーム内の表示で確かめられない
"""

STAT_LABELS: dict[tuple[int, int | None], str] = {
    (0, None): "魔力",
    (0, 2): "魔力",
    (1, None): "物理防御",
    (1, 2): "増加物理防御",
    (2, None): "攻撃力",
    (2, 2): "増加攻撃力",
    (4, None): "攻撃速度",
    (4, 2): "増加攻撃速度",
    (6, None): "魔法防御",
    (6, 2): "増加魔法防御",
    (7, None): "移動速度",
    (7, 2): "増加移動速度",
    (8, None): "クリティカル率",
    (12, None): "最大体力",
    (12, 1): "基礎体力",
    (12, 2): "増加体力",
}

# 1.0 が 100% のステータス。「100ごとに」ではなく「100%ごとに」と書く
# （Meraki: `5% per 100% bonus attack speed`）
RATIO_STAT_LABELS: frozenset[str] = frozenset(
    {"攻撃速度", "増加攻撃速度", "クリティカル率"}
)

# AbilityResourceByCoefficientCalculationPart（マナ）。mStatFormula: 無し=最大、2=増加
RESOURCE_LABELS: dict[int | None, str] = {
    None: "最大マナ",
    2: "増加マナ",
}


def stat_label(stat: int, formula: int | None) -> str | None:
    """ステータス名。表に無い組は None（解けない扱い）。"""
    return STAT_LABELS.get((stat, formula))


def resource_label(formula: int | None) -> str | None:
    """マナの名前。表に無い組は None。"""
    return RESOURCE_LABELS.get(formula)
