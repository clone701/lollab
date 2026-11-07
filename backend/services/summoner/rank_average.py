"""試合のランク: 参加者のランクを数値にして平均し、ランクに戻す（純粋関数）。"""

from schemas.match_detail import RankBrief
from schemas.summoner import MatchRankBrief

# ディビジョンを持つティア（低い順）。1ティアにつき IV〜I の4段階
_DIVISION_TIERS = (
    "IRON",
    "BRONZE",
    "SILVER",
    "GOLD",
    "PLATINUM",
    "EMERALD",
    "DIAMOND",
)
# ディビジョンの低い順（IV = 0 … I = 3）
_DIVISIONS = ("IV", "III", "II", "I")
# ディビジョンなしのティア。DIAMOND I（27）の次から続く
_APEX_TIERS = ("MASTER", "GRANDMASTER", "CHALLENGER")
_APEX_START = len(_DIVISION_TIERS) * len(_DIVISIONS)  # 28


def rank_score(rank: RankBrief) -> int | None:
    """ランクを数値にする（IRON IV = 0 … DIAMOND I = 27、MASTER = 28 … CHALLENGER = 30）。

    未知のティア、ディビジョンが必要なのに無いランクは None（平均に含めない）。
    """
    tier = rank.tier.upper()
    if tier in _APEX_TIERS:
        return _APEX_START + _APEX_TIERS.index(tier)
    if tier not in _DIVISION_TIERS or rank.division not in _DIVISIONS:
        return None
    return _DIVISION_TIERS.index(tier) * len(_DIVISIONS) + _DIVISIONS.index(
        rank.division
    )


def score_to_rank(score: int) -> MatchRankBrief:
    """数値をランクに戻す。"""
    if score >= _APEX_START:
        return MatchRankBrief(tier=_APEX_TIERS[score - _APEX_START], division=None)
    tier, step = divmod(score, len(_DIVISIONS))
    return MatchRankBrief(tier=_DIVISION_TIERS[tier], division=_DIVISIONS[step])


def average_rank(ranks: list[RankBrief]) -> MatchRankBrief | None:
    """ランクの平均（数値の平均を四捨五入）。数値にできるランクがなければ None。"""
    scores = [s for s in map(rank_score, ranks) if s is not None]
    if not scores:
        return None
    # 整数演算での四捨五入（0.5 は切り上げ）
    rounded = (2 * sum(scores) + len(scores)) // (2 * len(scores))
    return score_to_rank(rounded)
