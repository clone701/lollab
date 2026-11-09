"""クローラーの試合の保存量の上限（4万試合）を守る。"""

from adapters import crawler_match_store

# DB に残すクローラーの試合数の上限と、1回の起動で削除する最大件数
# Supabase の無料枠（500MB）に収める上限。1試合 約9.7KB（2026-11 の実測。#82）で約390MB
MAX_MATCHES = 40_000
BATCH = 2_000


async def prune(max_matches: int = MAX_MATCHES, batch: int = BATCH) -> int:
    """上限を超えた分を古い順に削除し、削除した試合数を返す。"""
    return await crawler_match_store.prune_crawler_matches(max_matches, batch)
