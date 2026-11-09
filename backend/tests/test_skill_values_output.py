"""scripts/skill_values/output.py のテスト。

_Requirements: 3.2, 3.4_
"""

from pathlib import Path

import pytest

from scripts.skill_values.output import build_document, dumps, write_champion_file


def test_同じ入力は同じ文字列() -> None:
    first = dumps(build_document("16.21.1", "P", ["Q", None, "E", "R"]))
    second = dumps(build_document("16.21.1", "P", ["Q", None, "E", "R"]))
    assert first == second


def test_キーの順とインデントと末尾の改行が固定() -> None:
    text = dumps(build_document("16.21.1", "パッシブ", ["Q", "W", "E", "R"]))
    assert text == (
        "{\n"
        '  "version": "16.21.1",\n'
        '  "passive": "パッシブ",\n'
        '  "spells": [\n'
        '    "Q",\n'
        '    "W",\n'
        '    "E",\n'
        '    "R"\n'
        "  ]\n"
        "}\n"
    )


def test_日本語はそのまま書く() -> None:
    text = dumps(build_document("16.21.1", "攻撃力の70%", [None] * 4))
    assert "攻撃力の70%" in text
    assert "\\u" not in text


def test_解けないスキルとパッシブは_null() -> None:
    text = dumps(build_document("16.21.1", None, ["Q", None, None, "R"]))
    assert '"passive": null' in text
    assert text.count("null") == 3


def test_spells_は_4つ() -> None:
    with pytest.raises(ValueError):
        build_document("16.21.1", None, ["Q", "W", "E"])


def test_ファイルは_lf_の_utf8_で_id_の名前で書く(tmp_path: Path) -> None:
    text = dumps(build_document("16.21.1", "日本語", [None] * 4))
    path = write_champion_file(tmp_path / "skills", "MonkeyKing", text)
    assert path == tmp_path / "skills" / "MonkeyKing.json"
    body = path.read_bytes()
    assert body == text.encode("utf-8")
    assert b"\r" not in body


def test_同じ内容ならファイルを書き換えない(tmp_path: Path) -> None:
    text = dumps(build_document("16.21.1", None, [None] * 4))
    path = write_champion_file(tmp_path, "Urgot", text)
    before = path.stat().st_mtime_ns
    write_champion_file(tmp_path, "Urgot", text)
    assert path.stat().st_mtime_ns == before
