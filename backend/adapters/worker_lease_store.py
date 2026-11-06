"""worker_leases（バックグラウンド処理のリース）へのアクセス層。

同じ処理（Backfill など）が同時に複数動かないよう、名前ごとに実行権を貸し出す。
取得は条件付きの UPDATE 1回で行い、行がなければ INSERT する。
"""

from datetime import datetime, timedelta, timezone

from adapters.query_runner import execute as _execute
from adapters.supabase import supabase

_TABLE = "worker_leases"


def _now() -> datetime:
    return datetime.now(timezone.utc)


async def try_acquire(name: str, holder: str, ttl: timedelta) -> bool:
    """リースの取得を試みる。取得できたら True、他が保持中なら False。

    期限（expires_at）が NULL または過去なら取得できる。判定と書き込みは
    1回の UPDATE で行うため、同時に呼んでも取得できるのは1つだけ。
    行がない初回だけ INSERT する（同時の INSERT は片方が重複で無視される）。
    """
    now = _now()
    expires_at = (now + ttl).isoformat()
    # or_ の値に含まれる "+" や小数点を避けるため、秒精度の Z 形式で渡す
    now_text = now.strftime("%Y-%m-%dT%H:%M:%SZ")

    updated = await _execute(
        lambda: supabase.table(_TABLE)
        .update({"holder": holder, "expires_at": expires_at})
        .eq("name", name)
        .or_(f"expires_at.is.null,expires_at.lt.{now_text}")
    )
    if updated:
        return True

    inserted = await _execute(
        lambda: supabase.table(_TABLE).upsert(
            {"name": name, "holder": holder, "expires_at": expires_at},
            on_conflict="name",
            ignore_duplicates=True,
        )
    )
    return len(inserted) > 0


async def release(name: str, holder: str) -> None:
    """リースを返す。holder が一致するときだけ、期限を NULL にする。

    期限切れ後に他の実行が取得していた場合は、何もしない。
    """
    await _execute(
        lambda: supabase.table(_TABLE)
        .update({"holder": None, "expires_at": None})
        .eq("name", name)
        .eq("holder", holder)
    )
