"""Riot API 取得結果（services/summoner/riot_fetch.py の戻り値）のモデル。"""

from pydantic import BaseModel

from schemas.summoner import RankData
from schemas.summoner_store import BanRecord, MatchRecord, ParticipantRecord


class AccountInfo(BaseModel):
    """account-v1 の取得結果"""

    puuid: str
    game_name: str
    tag_line: str


class LeagueInfo(BaseModel):
    """league-v4 の取得結果（ソロランクとフレックスの勝敗数）。

    エントリがないキューは UNRANKED・勝敗数 0 として扱う。
    """

    solo: RankData
    solo_summoner_id: str = ""
    flex_wins: int = 0
    flex_losses: int = 0
    # フレックスのエントリがなければ UNRANKED（ランクの記録に使う）
    flex_tier: str = "UNRANKED"
    flex_rank: str = ""
    flex_lp: int = 0

    @property
    def total_games(self) -> int:
        """ソロとフレックスの勝敗数の合計（更新時の変更検知に使う）"""
        return self.solo.wins + self.solo.losses + self.flex_wins + self.flex_losses


class ProfileInfo(BaseModel):
    """summoner-v4 / league-v4 とランク順位の取得結果。

    rank_* は summoners テーブルのカラムに対応する。順位が不明な場合は None。
    """

    level: int
    profile_icon_id: int
    rank: RankData
    flex_wins: int = 0
    flex_losses: int = 0
    rank_position: int | None = None
    rank_total: int | None = None
    rank_top_percent: float | None = None


class ParticipantTimeline(BaseModel):
    """タイムラインから求めた、参加者1人分のスキル習得順とアイテム購入"""

    puuid: str
    skill_order: list[int]
    starting_items: list[int]
    completed_items: list[int]


class FetchedMatch(BaseModel):
    """試合1件分（matches 1行 + match_participants 10行 + match_bans）

    タイムラインを取り込めた場合は、match.timeline_fetched_at と
    participants のタイムライン由来の列が入っている。取り込めなかった場合は
    それらが None で、タイムライン取得が（429 以外で）失敗したときだけ
    timeline_error に短いエラー内容が入る。
    """

    match: MatchRecord
    participants: list[ParticipantRecord]
    bans: list[BanRecord] = []
    timeline_error: str | None = None


class FailedFetch(BaseModel):
    """試合詳細の取得に失敗した試合（429 以外）。

    error は HTTP ステータスコードや例外型名などの短い文字列だけを入れる
    （URL・API キー・レスポンス本文を含めない）。
    """

    match_id: str
    error: str


class MatchDetailsResult(BaseModel):
    """fetch_match_details の結果: 取得できた試合と、失敗した試合"""

    fetched: list[FetchedMatch] = []
    failures: list[FailedFetch] = []
