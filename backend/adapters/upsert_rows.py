"""upsert 用の行の組み立て。"""

from collections.abc import Sequence
from typing import Any

from pydantic import BaseModel

# save_matches の行の組み立て（値があるときだけ書き込む列。
# タイムライン由来の列は marker で、rank_tier・raw_bundle_key は列ごとに判定する）
MATCH_ROWS: dict[str, Any] = {
    "marker": "timeline_fetched_at",
    "optional": {"timeline_fetched_at"},
    "exclude": {"created_at"},
    "independent": {"rank_tier", "raw_bundle_key"},
}
PART_ROWS: dict[str, Any] = {
    "marker": "skill_order",
    "optional": {"skill_order", "starting_items", "completed_items"},
    "independent": {"rank_tier"},
}


def dump_rows(
    models: Sequence[BaseModel],
    *,
    marker: str,
    optional: set[str],
    exclude: set[str] | None = None,
    independent: set[str] | None = None,
) -> list[list[dict[str, Any]]]:
    """モデルを upsert 用の行にし、列の揃ったグループに分けて返す。

    marker の値が None のモデルは、optional の列を除く。independent の列は、
    その列の値が None のモデルだけ除く。
    PostgREST の一括 upsert は列を揃える必要があり、None の列を含めると
    既存の値を NULL で上書きしてしまうため、その列自体を書き込まない。
    グループは除く列が少ない順（全列を持つグループが先頭）で、空のグループは返さない。
    """
    skip = exclude or set()
    groups: dict[frozenset[str], list[dict[str, Any]]] = {}
    for model in models:
        omitted = set(skip)
        if getattr(model, marker) is None:
            omitted |= optional
        omitted |= {c for c in independent or () if getattr(model, c) is None}
        row = model.model_dump(mode="json", exclude=omitted)
        groups.setdefault(frozenset(omitted), []).append(row)
    ordered = sorted(groups.items(), key=lambda item: len(item[0]))
    return [rows for _, rows in ordered]
