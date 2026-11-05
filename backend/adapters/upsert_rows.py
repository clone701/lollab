"""upsert 用の行の組み立て。"""

from collections.abc import Sequence
from typing import Any

from pydantic import BaseModel

# save_matches の行の組み立て（タイムライン由来の列は値があるときだけ書き込む）
MATCH_ROWS: dict[str, Any] = {
    "marker": "timeline_fetched_at",
    "optional": {"timeline_fetched_at"},
    "exclude": {"created_at"},
}
PART_ROWS: dict[str, Any] = {
    "marker": "skill_order",
    "optional": {"skill_order", "starting_items", "completed_items"},
}


def dump_rows(
    models: Sequence[BaseModel],
    *,
    marker: str,
    optional: set[str],
    exclude: set[str] | None = None,
) -> list[list[dict[str, Any]]]:
    """モデルを upsert 用の行にし、列の揃ったグループに分けて返す。

    marker の値が None のモデルは、optional の列を除いた別グループにする。
    PostgREST の一括 upsert は列を揃える必要があり、None の列を含めると
    既存の値を NULL で上書きしてしまうため、その列自体を書き込まない。
    空のグループは返さない。
    """
    skip = exclude or set()
    full = [m.model_dump(mode="json", exclude=skip) for m in models if _has(m, marker)]
    partial = [
        m.model_dump(mode="json", exclude=skip | optional)
        for m in models
        if not _has(m, marker)
    ]
    return [rows for rows in (full, partial) if rows]


def _has(model: BaseModel, field: str) -> bool:
    return getattr(model, field) is not None
