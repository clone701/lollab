"""チャンピオン統計の集計範囲: 今のランクの年の始まりを決める。"""

import re
from datetime import datetime

from adapters import season_store
from schemas.summoner_store import SeasonRecord

# シーズン id の先頭の年（例: 2026-S3 の 2026-）。年が取れない id は対象外
_YEAR_PREFIX = re.compile(r"^\d{4}-")


def resolve_stats_year(season: SeasonRecord | None) -> int | None:
    """集計の範囲のランクの年を返す。

    Args:
        season: 現行シーズン（end_at が NULL）。未登録なら None

    Returns:
        シーズン id の先頭4桁の年（例: 2026-S3 → 2026）。
        現行シーズンが未登録、または年が取れない id なら None
    """
    if season is None:
        return None
    match = _YEAR_PREFIX.match(season.id)
    if match is None:
        return None
    return int(match.group()[:4])


async def resolve_stats_start(season: SeasonRecord | None) -> datetime | None:
    """集計の開始日時を返す。None は全期間。

    ランクは年が変わるときだけリセットされるため、現行シーズンと同じ年の
    シーズン（id が同じ年で始まるもの）のうち最も早い start_at から数える。

    Args:
        season: 現行シーズン（end_at が NULL）。未登録なら None

    Returns:
        現行シーズンが未登録なら None（全期間）。id から年が取れなければ
        そのシーズンの start_at。取れれば同じ年の最も早い start_at
    """
    if season is None:
        return None
    match = _YEAR_PREFIX.match(season.id)
    if match is None:
        return season.start_at
    earliest = await season_store.get_earliest_start_at(match.group())
    return earliest if earliest is not None else season.start_at
