from datetime import datetime

from pydantic import BaseModel


class RankData(BaseModel):
    queueType: str
    tier: str  # "UNRANKED" | "IRON" | ... | "CHALLENGER"
    rank: str  # "I" | "II" | "III" | "IV" | ""
    leaguePoints: int
    wins: int
    losses: int


class SummonerData(BaseModel):
    puuid: str
    name: str
    tagLine: str
    level: int
    profileIconId: int
    rank: RankData
    lastUpdatedAt: datetime


class RankPositionData(BaseModel):
    position: int  # 同ティア内順位（0=不明）
    totalPlayers: int  # 同ティア内プレイヤー数（0=不明）
    topPercent: float  # 全体上位%


class MatchParticipantBrief(BaseModel):
    """試合カードの参加者の列（名前とチャンピオンだけ）"""

    puuid: str
    teamId: int  # 100 / 200
    championName: str
    riotIdGameName: str | None
    riotIdTagline: str | None


class MatchRankBrief(BaseModel):
    """試合のランク（ランクが分かる参加者の平均）"""

    tier: str  # EMERALD など
    division: str | None  # マスター以上は None


class MatchData(BaseModel):
    matchId: str
    isWin: bool
    isRemake: bool = False  # リメイク（早期降伏）の試合
    gameMode: str
    queueId: (
        int  # 420 = ソロ/デュオ、440 = フレックス（表示名はフロントエンドで決める）
    )
    championName: str
    kills: int
    deaths: int
    assists: int
    killParticipation: float  # 0〜1。(キル + アシスト) / 自チームの合計キル
    cs: int
    gameDurationSeconds: int
    itemIds: list[int]
    spellIds: list[int]  # [spell1, spell2]
    keystoneId: int
    subStyleId: int
    participants: list[MatchParticipantBrief]  # 10人。チーム、team_position の順
    averageRank: MatchRankBrief | None
    timeAgoSeconds: int


class ChampionStatData(BaseModel):
    championName: str
    wins: int
    losses: int
    cs: float  # 1試合あたりの平均 CS
    csPerMinute: float  # 分あたりの平均 CS（試合時間の合計が 0 なら 0）
    kills: float  # 1試合あたりの平均キル
    deaths: float  # 1試合あたりの平均デス
    assists: float  # 1試合あたりの平均アシスト
    kda: float


class ChampionStatsByQueue(BaseModel):
    """キューごとのチャンピオン統計（各リストは試合数の降順）"""

    all: list[ChampionStatData]  # ソロ(420)とフレックス(440)の両方
    solo: list[ChampionStatData]  # 420
    flex: list[ChampionStatData]  # 440


class SummonerDetail(BaseModel):
    summoner: SummonerData
    rankPosition: RankPositionData | None
    matches: list[MatchData]  # 新しい順に最大20件
    championStats: ChampionStatsByQueue  # 今のランクの年の保存済み試合から集計
    championStatsYear: int | None  # 集計の範囲のランクの年。不明なら None
