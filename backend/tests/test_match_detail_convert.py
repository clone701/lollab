"""services/match/convert.py のテスト: 成績・チーム・並び（純粋関数）。

_Requirements: 2.2〜2.8
"""

from datetime import datetime, timezone

import pytest

from schemas.match_detail import ParticipantBuild, RankBrief
from services.match.convert import build_match_detail, kill_participation
from tests.match_helpers import raw_detail


def test_participants_are_ordered_by_team_then_position_with_empty_last() -> None:
    response = build_match_detail(raw_detail(), {}, None)

    assert [(p.team_id, p.team_position) for p in response.participants] == [
        (100, "TOP"),
        (100, "JUNGLE"),
        (100, "BOTTOM"),
        (100, "UTILITY"),
        (100, ""),
        (200, "TOP"),
        (200, "JUNGLE"),
        (200, "MIDDLE"),
        (200, "BOTTOM"),
        (200, "UTILITY"),
    ]


def test_participant_stats_are_mapped() -> None:
    response = build_match_detail(raw_detail(), {}, None)

    p = next(p for p in response.participants if p.puuid == "puuid-0")
    assert (p.riot_id_game_name, p.riot_id_tagline) == ("Name0", "T0")
    assert (p.team_id, p.team_position, p.champion_name) == (100, "BOTTOM", "Champ0")
    assert p.champ_level == 15
    assert p.spell_ids == [4, 14]
    assert (p.primary_style_id, p.sub_style_id) == (8100, 8200)
    assert p.primary_perk_ids == [8112, 8126, 8139, 8135]
    assert p.sub_perk_ids == [8226, 8210]
    assert p.stat_perk_ids == [5005, 5008, 5002]
    assert (p.kills, p.deaths, p.assists) == (5, 2, 8)
    assert p.damage_to_champions == 23456 and p.damage_taken == 10_000
    assert (p.wards_placed, p.wards_killed, p.control_wards_bought) == (0, 1, 2)
    assert p.cs == 160 and p.gold_earned == 12345
    assert p.item_ids == [3157, 3089, 3135, 3020, 3165, 3040, 3363]


def test_kill_participation_uses_team_total_kills() -> None:
    response = build_match_detail(raw_detail(), {}, None)

    # チームの合計キルは 5 × 5 = 25。(5 + 8) / 25
    assert {p.kill_participation for p in response.participants} == {0.52}


def test_kill_participation_is_zero_when_team_has_no_kills() -> None:
    detail = raw_detail()
    for p in detail["info"]["participants"]:
        p["kills"] = 0

    response = build_match_detail(detail, {}, None)

    assert {p.kill_participation for p in response.participants} == {0.0}
    assert kill_participation(0, 5, 0) == 0.0


@pytest.mark.parametrize(
    "kills, assists, team_kills, expected",
    [(5, 5, 20, 0.5), (0, 0, 10, 0.0), (10, 0, 10, 1.0)],
)
def test_kill_participation_ratio(
    kills: int, assists: int, team_kills: int, expected: float
) -> None:
    assert kill_participation(kills, assists, team_kills) == expected


def test_teams_have_result_totals_and_objectives_sorted_by_team_id() -> None:
    response = build_match_detail(raw_detail(), {}, None)

    blue, red = response.teams
    assert (blue.team_id, blue.win, blue.kills, blue.gold) == (100, True, 25, 61725)
    assert blue.objectives == {
        "baron": 0,
        "dragon": 3,
        "rift_herald": 1,
        "horde": 6,
        "atakhan": 0,
        "tower": 9,
        "inhibitor": 2,
    }
    assert (red.team_id, red.win, red.kills) == (200, False, 25)
    # 生データにないオブジェクトは 0
    assert red.objectives["baron"] == 1
    assert red.objectives["dragon"] == 0 and red.objectives["atakhan"] == 0


def test_teams_without_objectives_get_zero_counts() -> None:
    detail = raw_detail()
    for team in detail["info"]["teams"]:
        del team["objectives"]

    response = build_match_detail(detail, {}, None)

    assert all(set(t.objectives.values()) == {0} for t in response.teams)
    assert len(response.teams[0].objectives) == 7


def test_match_summary_comes_from_detail() -> None:
    response = build_match_detail(raw_detail("JP1_77"), {}, None)

    assert response.match_id == "JP1_77"
    assert response.queue_id == 420
    assert response.game_duration == 1800
    assert response.game_end_at == datetime.fromtimestamp(
        1_700_000_000.123, tz=timezone.utc
    )


def test_rank_and_build_are_attached_by_puuid() -> None:
    rank = RankBrief(tier="EMERALD", division="II")
    build = ParticipantBuild(item_purchases=[], skill_order=[1], skill_priority=[1])

    response = build_match_detail(raw_detail(), {"puuid-3": rank}, {"puuid-3": build})

    by_puuid = {p.puuid: p for p in response.participants}
    assert by_puuid["puuid-3"].rank == rank and by_puuid["puuid-3"].build == build
    assert by_puuid["puuid-4"].rank is None and by_puuid["puuid-4"].build is None


def test_no_builds_means_none_for_everyone() -> None:
    response = build_match_detail(raw_detail(), {}, None)

    assert all(p.build is None for p in response.participants)


def test_empty_riot_id_becomes_none() -> None:
    detail = raw_detail()
    detail["info"]["participants"][0]["riotIdGameName"] = ""
    del detail["info"]["participants"][0]["riotIdTagline"]

    response = build_match_detail(detail, {}, None)

    p = next(p for p in response.participants if p.puuid == "puuid-0")
    assert (p.riot_id_game_name, p.riot_id_tagline) == (None, None)


def test_malformed_detail_raises_key_error() -> None:
    detail = raw_detail()
    del detail["info"]["participants"][0]["perks"]

    with pytest.raises(KeyError):
        build_match_detail(detail, {}, None)
