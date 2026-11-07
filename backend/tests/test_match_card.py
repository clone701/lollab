"""match_card.py のユニットテスト: 試合カードの組み立て（ストアはモック）。"""

import asyncio
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, patch

from schemas.match_detail import RankBrief
from schemas.summoner import MatchData
from schemas.summoner_store import MatchMemberRecord, ParticipationRecord
from services.summoner.match_card import build_match_cards
from tests.participation_helpers import member, participation
from tests.sync_helpers import install_store_stub

install_store_stub()

_MEMBERS = "services.summoner.match_card.match_member_store.get_members_by_match"
_RANKS = "services.summoner.match_card.match_rank_store.get_ranks"


def _run(
    recent: list[ParticipationRecord],
    members: dict[str, list[MatchMemberRecord]],
    ranks: dict[str, RankBrief] | None = None,
) -> tuple[list[MatchData], AsyncMock, AsyncMock]:
    mock_members = AsyncMock(return_value=members)
    mock_ranks = AsyncMock(return_value=ranks or {})
    with patch(_MEMBERS, new=mock_members), patch(_RANKS, new=mock_ranks):
        cards = asyncio.run(build_match_cards(recent, datetime.now(timezone.utc)))
    return cards, mock_members, mock_ranks


def _ten(match_id: str = "JP1_1") -> list[MatchMemberRecord]:
    """チーム100 は puuid-0 〜 4、チーム200 は puuid-5 〜 9（キルは 1, 2, 3, ...）。"""
    positions = ["UTILITY", "", "TOP", "BOTTOM", "JUNGLE"] * 2
    return [
        member(
            match_id,
            f"puuid-{i}",
            team_id=100 if i < 5 else 200,
            team_position=positions[i],
            kills=i + 1,
        )
        for i in range(10)
    ]


def test_no_recent_makes_no_query() -> None:
    cards, mock_members, mock_ranks = _run([], {})

    assert cards == []
    mock_members.assert_not_awaited()
    mock_ranks.assert_not_awaited()


def test_participants_are_ordered_by_team_then_position() -> None:
    """チームID、TOP, JUNGLE, MIDDLE, BOTTOM, UTILITY の順。ポジションが空の人は最後。"""
    cards, _, _ = _run([participation()], {"JP1_1": _ten()})

    order = [p.puuid for p in cards[0].participants]
    assert order == [
        "puuid-2",  # TOP
        "puuid-4",  # JUNGLE
        "puuid-3",  # BOTTOM
        "puuid-0",  # UTILITY
        "puuid-1",  # 空
        "puuid-7",
        "puuid-9",
        "puuid-8",
        "puuid-5",
        "puuid-6",
    ]
    first = cards[0].participants[0]
    assert (first.teamId, first.riotIdGameName, first.riotIdTagline) == (
        100,
        "Name-puuid-2",
        "JP1",
    )


def test_kill_participation_uses_own_team_kills() -> None:
    """チーム100 の合計キルは 1+2+3+4+5 = 15。(kills 5 + assists 5) / 15。"""
    p = participation(puuid="puuid-4", team_id=100, kills=5, assists=5)

    cards, _, _ = _run([p], {"JP1_1": _ten()})

    assert cards[0].killParticipation == 10 / 15


def test_kill_participation_is_zero_without_team_kills() -> None:
    p = participation(kills=0, assists=0)
    members = {"JP1_1": [member(kills=0), member(puuid="b", kills=0)]}

    cards, _, _ = _run([p], members)

    assert cards[0].killParticipation == 0.0


def test_match_without_members_still_builds_card() -> None:
    """参加者の行が見つからない試合は、参加者なし・キル関与率0・ランクなしにする。"""
    cards, _, _ = _run([participation()], {})

    assert cards[0].participants == []
    assert cards[0].killParticipation == 0.0
    assert cards[0].averageRank is None


def test_card_copies_participation_fields() -> None:
    p = participation(queue_id=440, spell1_id=7, spell2_id=3, keystone_id=8010)

    cards, _, _ = _run([p], {"JP1_1": _ten()})

    card = cards[0]
    assert card.queueId == 440
    assert card.spellIds == [7, 3]
    assert (card.keystoneId, card.subStyleId) == (8010, 8200)
    assert card.itemIds == [3157, 3089, 0, 0, 0, 0, 3363]
    assert abs(card.timeAgoSeconds - 3600) < 5


def test_average_rank_per_match_and_unknown_ranks_are_skipped() -> None:
    """ランクが分かる人（2人）だけの平均を試合ごとに求める。"""
    recent = [
        participation("JP1_1"),
        participation("JP1_2", ended_ago=timedelta(days=1)),
    ]
    members = {"JP1_1": _ten("JP1_1"), "JP1_2": [member("JP1_2", "solo")]}
    ranks = {
        "puuid-0": RankBrief(tier="DIAMOND", division="IV"),
        "puuid-1": RankBrief(tier="DIAMOND", division="II"),
        "solo": RankBrief(tier="MASTER", division=None),
    }

    cards, _, _ = _run(recent, members, ranks)

    assert cards[0].averageRank is not None
    assert (cards[0].averageRank.tier, cards[0].averageRank.division) == (
        "DIAMOND",
        "III",
    )
    assert cards[1].averageRank is not None
    assert (cards[1].averageRank.tier, cards[1].averageRank.division) == (
        "MASTER",
        None,
    )


def test_ranks_are_requested_in_chunks_of_50_without_duplicates() -> None:
    """PUUID は重複を除き、50件ずつ問い合わせる（URL が長くなりすぎないように）。"""
    recent = [participation(f"JP1_{i}") for i in range(2)]
    members = {
        "JP1_0": [member("JP1_0", f"p{i:03d}") for i in range(10)],
        "JP1_1": [member("JP1_1", f"p{i:03d}") for i in range(5, 120)],
    }

    _, mock_members, mock_ranks = _run(recent, members)

    mock_members.assert_awaited_once_with(["JP1_0", "JP1_1"])
    sizes = [len(call.args[0]) for call in mock_ranks.await_args_list]
    assert sizes == [50, 50, 20]


def test_remake_is_marked_on_card() -> None:
    """リメイクの試合はカードに isRemake を付ける（それ以外は False）。"""
    remake = participation("JP1_1", is_remake=True)
    normal = participation("JP1_2")

    cards, _, _ = _run([remake, normal], {})

    assert [c.isRemake for c in cards] == [True, False]
