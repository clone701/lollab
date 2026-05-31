from pydantic import BaseModel


class RankData(BaseModel):
    queueType: str
    tier: str  # "UNRANKED" | "IRON" | ... | "CHALLENGER"
    rank: str  # "I" | "II" | "III" | "IV" | ""
    leaguePoints: int
    wins: int
    losses: int


class SummonerData(BaseModel):
    name: str
    tagLine: str
    level: int
    profileIconId: int
    rank: RankData


class RankPositionData(BaseModel):
    position: int  # 同ティア内順位（0=不明）
    totalPlayers: int  # 同ティア内プレイヤー数（0=不明）
    topPercent: float  # 全体上位%


class MatchData(BaseModel):
    matchId: str
    isWin: bool
    gameMode: str
    championName: str
    kills: int
    deaths: int
    assists: int
    cs: int
    gameDurationSeconds: int
    itemIds: list[int]
    timeAgoSeconds: int


class ChampionStatData(BaseModel):
    championName: str
    wins: int
    losses: int
    cs: float
    kda: float
