"""ビルド要素ごとの選択肢集計（純粋関数）。"""

from collections.abc import Iterable

from schemas.champion import BuildElement, BuildOption

# 応答に含める選択肢の最大数
DEFAULT_LIMIT = 10


def aggregate_element(
    keys: Iterable[tuple[tuple[int, ...], bool]], limit: int = DEFAULT_LIMIT
) -> BuildElement:
    """選択肢ごとの試合数・勝利数を数え、ビルド要素の集計を作る。

    options は試合数の降順（同数はキーの辞書順）で最大 limit 件。

    Args:
        keys: 集計対象の行ごとの (選択肢のキー, 勝利したか)
        limit: options に含める最大件数

    Returns:
        BuildElement（games は keys の件数）
    """
    totals: dict[tuple[int, ...], list[int]] = {}
    games = 0
    for key, win in keys:
        games += 1
        entry = totals.setdefault(key, [0, 0])
        entry[0] += 1
        entry[1] += int(win)

    options = [
        BuildOption(key=list(key), games=g, wins=w) for key, (g, w) in totals.items()
    ]
    ranked = sorted(options, key=lambda o: (-o.games, o.key))
    return BuildElement(games=games, options=ranked[:limit])
