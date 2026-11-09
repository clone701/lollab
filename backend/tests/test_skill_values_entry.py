"""scripts/build_skill_values.py（入口）のテスト。取得は代役で、ネットワークを使わない。

_Requirements: 3.1, 3.3_
"""

import json
import shutil
from pathlib import Path
from typing import Any

import pytest

from scripts import build_skill_values
from scripts.skill_values.report import Tally, format_report
from tests.skill_values_helpers import FIXTURES

DDRAGON = FIXTURES / "ddragon" / "16.21.1"
CHAMPIONS = ("urgot", "ahri", "jinx")


def forbidden_download(url: str) -> bytes | None:
    raise AssertionError(f"取得してはいけません: {url}")


def prepare_cache(cache: Path) -> None:
    """fixtures をキャッシュの形（<cache>/16.21/）に置く。"""
    folder = cache / "16.21"
    folder.mkdir(parents=True)
    for champion in CHAMPIONS:
        shutil.copy(FIXTURES / f"{champion}.bin.json", folder)
    shutil.copy(FIXTURES / "lol.stringtable.json", folder)


def read(path: Path) -> dict[str, Any]:
    document: dict[str, Any] = json.loads(path.read_text(encoding="utf-8"))
    return document


def test_fixtures_で最後まで動き_結果のファイルが書かれる(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    cache, out = tmp_path / "cache", tmp_path / "out"
    prepare_cache(cache)
    argv = [str(DDRAGON), "--cache", str(cache), "--output", str(out)]
    assert build_skill_values.main(argv, forbidden_download) == 0

    assert sorted(p.name for p in out.glob("*.json")) == [
        "Ahri.json",
        "Jinx.json",
        "Urgot.json",
    ]
    urgot = read(out / "Urgot.json")
    assert urgot["version"] == "16.21.1"
    assert isinstance(urgot["passive"], str) and "攻撃力の40〜100%" in urgot["passive"]
    spells = urgot["spells"]
    assert isinstance(spells, list) and len(spells) == 4
    assert "25/70/115/160/205 (+攻撃力の70%)" in str(spells[0])
    assert spells[3] is None  # R は fixtures に無い
    ahri = read(out / "Ahri.json")
    assert ahri["passive"] is None
    assert "35/60/85/110/135 (+魔力の50%)" in str(ahri["spells"][0])


def test_最後に解けた数と割合と解けなかった理由を表示する(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    cache = tmp_path / "cache"
    prepare_cache(cache)
    argv = [str(DDRAGON), "--cache", str(cache), "--output", str(tmp_path / "out")]
    build_skill_values.main(argv, forbidden_download)
    shown = capsys.readouterr().out
    # 3 体 × (パッシブ + Q/W/E/R) = 15 のうち、アーゴット 4・アーリ 1・ジンクス 1
    assert "解けたスキル: 6/15 (40.0%)" in shown
    assert "  パッシブ: 1/3 (33.3%)" in shown
    assert "  Q: 2/3 (66.7%)" in shown
    assert "  R: 0/3 (0.0%)" in shown
    assert "スペルが見つからない" in shown


def test_解けなかった名前の上位を多い順に出す() -> None:
    tally = Tally()
    for _ in range(3):
        tally.add_reason("名前が見つからない: Foo")
    tally.add_reason("未対応の部品: Bar")
    tally.add("Q", "文")
    tally.add("Q", None)
    lines = format_report(tally).splitlines()
    assert lines[0] == "解けたスキル: 1/2 (50.0%)"
    assert lines[-2].endswith("名前が見つからない: Foo") and "3" in lines[-2]
    assert lines[-1].endswith("未対応の部品: Bar")


def test_上位は_20_件まで() -> None:
    tally = Tally()
    for number in range(30):
        tally.add_reason(f"理由{number:02d}")
    reasons = [
        line for line in format_report(tally).splitlines() if line.startswith("  ")
    ]
    assert len([r for r in reasons if "理由" in r]) == 20


def test_キャッシュが無ければ取得して保存し_2回目は取得しない(tmp_path: Path) -> None:
    base = "https://raw.communitydragon.org/16.21/game"
    files = {f"{base}/ja_jp/data/menu/en_us/lol.stringtable.json": "lol.stringtable"}
    for c in CHAMPIONS:
        files[f"{base}/data/characters/{c}/{c}.bin.json"] = f"{c}.bin"
    calls: list[str] = []

    def downloader(url: str) -> bytes | None:
        calls.append(url)
        return (FIXTURES / f"{files[url]}.json").read_bytes()

    cache = tmp_path / "cache"
    tally = build_skill_values.build(DDRAGON, cache, tmp_path / "out", downloader)
    assert tally.solved_all == 6
    assert len(calls) == 4
    assert (cache / "16.21" / "urgot.bin.json").exists()

    build_skill_values.build(DDRAGON, cache, tmp_path / "out", forbidden_download)
    assert len(calls) == 4


def test_2回流しても出力が変わらない(tmp_path: Path) -> None:
    cache, out = tmp_path / "cache", tmp_path / "out"
    prepare_cache(cache)

    def snapshot() -> dict[str, bytes]:
        return {p.name: p.read_bytes() for p in sorted(out.glob("*.json"))}

    build_skill_values.build(DDRAGON, cache, out, forbidden_download)
    first = snapshot()
    build_skill_values.build(DDRAGON, cache, out, forbidden_download)
    assert snapshot() == first


def test_bin_が見つからないチャンピオンは全部_null_で_理由を数える(
    tmp_path: Path,
) -> None:
    cache = tmp_path / "cache"
    prepare_cache(cache)
    (cache / "16.21" / "jinx.bin.json").unlink()
    tally = build_skill_values.build(DDRAGON, cache, tmp_path / "out", lambda url: None)
    assert tally.reasons["bin.json が見つからない"] == 1
    jinx = read(tmp_path / "out" / "Jinx.json")
    assert jinx["passive"] is None and jinx["spells"] == [None] * 4
