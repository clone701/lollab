"""match_convert.convert_match のユニットテスト: ビルド・試合詳細用の追加項目。

_Requirements: 4.5_
"""

import pytest

from schemas.summoner_store import BanRecord
from services.summoner.match_convert import convert_match
from tests.riot_fetch_helpers import match_detail


def test_convert_match_adds_patch_and_detail_version() -> None:
    """patch は gameVersion の先頭2要素。detail_version は 2。"""
    result = convert_match(match_detail())

    assert result.match.patch == "15.10"
    assert result.match.detail_version == 2
    assert result.match.is_remake is False
    assert all(p.patch == "15.10" for p in result.participants)
    assert all(p.is_remake is False for p in result.participants)
    assert result.match.timeline_fetched_at is None


@pytest.mark.parametrize(
    ("version", "expected"),
    [("16.22.123.4", "16.22"), ("16.2", "16.2"), ("16", None)],
)
def test_convert_match_patch_takes_first_two_parts(
    version: str, expected: str | None
) -> None:
    detail = match_detail()
    detail["info"]["gameVersion"] = version

    assert convert_match(detail).match.patch == expected


def test_convert_match_keeps_rune_order_and_shards() -> None:
    """メイン4つ・サブ2つはスロット順、シャードは offense, flex, defense の順。"""
    p = convert_match(match_detail()).participants[0]

    assert p.primary_perk_ids == [8112, 8126, 8139, 8135]
    assert p.sub_perk_ids == [8226, 8210]
    assert p.stat_perk_ids == [5005, 5008, 5002]
    assert p.keystone_id == 8112
    assert (p.primary_style_id, p.sub_style_id) == (8100, 8200)


def test_convert_match_ignores_extra_selections() -> None:
    """想定より多い selections は、メイン4つ・サブ2つまでにする。"""
    detail = match_detail()
    styles = detail["info"]["participants"][0]["perks"]["styles"]
    styles[0]["selections"].append({"perk": 1})
    styles[1]["selections"].append({"perk": 2})

    p = convert_match(detail).participants[0]

    assert p.primary_perk_ids == [8112, 8126, 8139, 8135]
    assert p.sub_perk_ids == [8226, 8210]


def test_convert_match_saves_bans_except_no_ban() -> None:
    """両チームの BAN を保存する。championId が -1（BAN なし）は保存しない。"""
    result = convert_match(match_detail("JP1_7"))

    assert result.bans == [
        BanRecord(match_id="JP1_7", team_id=100, pick_turn=1, champion_id=11),
        BanRecord(match_id="JP1_7", team_id=200, pick_turn=6, champion_id=22),
    ]


def test_convert_match_remake_when_any_participant_surrendered_early() -> None:
    """いずれかの参加者の gameEndedInEarlySurrender が true ならリメイク。"""
    detail = match_detail()
    detail["info"]["participants"][3]["gameEndedInEarlySurrender"] = True

    result = convert_match(detail)

    assert result.match.is_remake is True
    assert all(p.is_remake for p in result.participants)


def test_convert_match_remake_false_when_flag_is_absent() -> None:
    detail = match_detail()
    for p in detail["info"]["participants"]:
        del p["gameEndedInEarlySurrender"]

    assert convert_match(detail).match.is_remake is False
