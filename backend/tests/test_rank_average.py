"""rank_average.py のユニットテスト: ランクの数値化と平均（試合のランク）。"""

import pytest
from hypothesis import given, settings
from hypothesis.strategies import integers, lists

from schemas.match_detail import RankBrief
from schemas.summoner import MatchRankBrief
from services.summoner.rank_average import average_rank, rank_score, score_to_rank


@pytest.mark.parametrize(
    ("tier", "division", "score"),
    [
        ("IRON", "IV", 0),
        ("IRON", "I", 3),
        ("BRONZE", "IV", 4),
        ("GOLD", "II", 14),
        ("EMERALD", "I", 23),
        ("DIAMOND", "IV", 24),
        ("DIAMOND", "I", 27),
        ("MASTER", None, 28),
        ("GRANDMASTER", None, 29),
        ("CHALLENGER", None, 30),
    ],
)
def test_rank_score(tier: str, division: str | None, score: int) -> None:
    assert rank_score(RankBrief(tier=tier, division=division)) == score


@pytest.mark.parametrize(
    "rank",
    [
        RankBrief(tier="UNKNOWN", division="I"),
        RankBrief(tier="GOLD", division=None),
        RankBrief(tier="GOLD", division="V"),
    ],
)
def test_rank_score_unknown_is_none(rank: RankBrief) -> None:
    """未知のティア・ディビジョンが必要なのに無いランクは数値にしない。"""
    assert rank_score(rank) is None


def test_rank_score_ignores_division_of_apex_tier() -> None:
    assert rank_score(RankBrief(tier="MASTER", division="I")) == 28


def test_average_rank_rounds_half_up() -> None:
    """GOLD IV(12) と GOLD III(13) の平均 12.5 は 13（GOLD III）。"""
    ranks = [
        RankBrief(tier="GOLD", division="IV"),
        RankBrief(tier="GOLD", division="III"),
    ]

    assert average_rank(ranks) == MatchRankBrief(tier="GOLD", division="III")


def test_average_rank_rounds_down_below_half() -> None:
    """12, 12, 13 の平均 12.33 は 12（GOLD IV）。"""
    ranks = [RankBrief(tier="GOLD", division="IV")] * 2 + [
        RankBrief(tier="GOLD", division="III")
    ]

    assert average_rank(ranks) == MatchRankBrief(tier="GOLD", division="IV")


def test_average_rank_crosses_tier_and_apex_boundaries() -> None:
    """DIAMOND I(27) と CHALLENGER(30) の平均 28.5 は 29（GRANDMASTER、ディビジョンなし）。"""
    ranks = [
        RankBrief(tier="DIAMOND", division="I"),
        RankBrief(tier="CHALLENGER", division=None),
    ]

    assert average_rank(ranks) == MatchRankBrief(tier="GRANDMASTER", division=None)


def test_average_rank_skips_unscorable_ranks() -> None:
    ranks = [
        RankBrief(tier="GOLD", division=None),
        RankBrief(tier="SILVER", division="I"),
    ]

    assert average_rank(ranks) == MatchRankBrief(tier="SILVER", division="I")


def test_average_rank_none_when_no_rank() -> None:
    assert average_rank([]) is None
    assert average_rank([RankBrief(tier="GOLD", division=None)]) is None


@settings(max_examples=100)
@given(integers(min_value=0, max_value=30))
def test_score_round_trip(score: int) -> None:
    """数値 → ランク → 数値で元に戻る。"""
    brief = score_to_rank(score)

    assert rank_score(RankBrief(tier=brief.tier, division=brief.division)) == score


@settings(max_examples=100)
@given(lists(integers(min_value=0, max_value=30), min_size=1, max_size=10))
def test_average_is_between_min_and_max(scores: list[int]) -> None:
    """平均は最小値と最大値の間に収まる。"""
    ranks = [
        RankBrief(tier=b.tier, division=b.division) for b in map(score_to_rank, scores)
    ]

    result = average_rank(ranks)

    assert result is not None
    value = rank_score(RankBrief(tier=result.tier, division=result.division))
    assert value is not None
    assert min(scores) <= value <= max(scores)
