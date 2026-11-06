"""クローラーが集めた試合の保存量の管理（prune_crawler_matches の RPC 呼び出し）。"""

import asyncio

from adapters.supabase import supabase


async def prune_crawler_matches(max_matches: int, batch: int) -> int:
    """上限を超えたクローラーの試合を古い順に最大 batch 件削除し、削除した件数を返す。

    検索済みサモナーが参加した試合と rank_tier のない試合は削除しない
    （判定は DB の関数 prune_crawler_matches が行う）。
    """
    response = await asyncio.to_thread(
        lambda: supabase.rpc(
            "prune_crawler_matches", {"max_matches": max_matches, "batch": batch}
        ).execute()
    )
    data = response.data
    return int(data) if isinstance(data, (int, float)) else 0
