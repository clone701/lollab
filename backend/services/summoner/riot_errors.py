"""Riot API 取得で使う例外と、エラー内容の要約。"""

import httpx

from adapters.riot_rate_limiter import RateLimitExceeded
from schemas.riot_fetch import FailedFetch, FetchedMatch


class RiotRateLimitError(httpx.HTTPStatusError):
    """Riot API が 429（レート制限）を返した、または送信前のレート制限で送れなかったことを表す。

    fetched には、429 を受ける前に取得できた試合、failures には同じ呼び出しで
    個別に失敗した試合を入れる（呼び出し元はこれらを処理してから終われる）。
    HTTPStatusError のサブクラスなので、handle_riot_error にそのまま渡せる。
    """

    def __init__(self, original: httpx.HTTPStatusError) -> None:
        super().__init__(
            str(original), request=original.request, response=original.response
        )
        self.fetched: list[FetchedMatch] = []
        self.failures: list[FailedFetch] = []


def from_rate_limit_exceeded(exceeded: RateLimitExceeded) -> RiotRateLimitError:
    """送信前のレート制限（adapters 層の例外）を、429 相当の RiotRateLimitError にする。"""
    request = httpx.Request("GET", f"https://{exceeded.host}.api.riotgames.com")
    response = httpx.Response(429, request=request)
    original = httpx.HTTPStatusError(
        "Riot API の送信前レート制限", request=request, response=response
    )
    return RiotRateLimitError(original)


def describe_fetch_error(error: Exception) -> str:
    """取得失敗の内容を短い文字列にする。

    HTTP エラーはステータスコード、それ以外は例外の型名だけを返す。
    URL・API キー・レスポンス本文など、メッセージの内容は含めない。
    """
    if isinstance(error, httpx.HTTPStatusError):
        return f"HTTP {error.response.status_code}"
    return type(error).__name__
