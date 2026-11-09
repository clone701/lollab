"""結果のファイルの形と書き出し（キーの順・インデント・改行を固定する）。"""

import json
from pathlib import Path

SPELL_COUNT = 4


def build_document(
    version: str, passive: str | None, spells: list[str | None]
) -> dict[str, object]:
    """結果の JSON。spells は Q/W/E/R の順の 4 つ（解けないものは None）。"""
    if len(spells) != SPELL_COUNT:
        raise ValueError(f"spells は {SPELL_COUNT} つ必要です: {len(spells)}")
    return {"version": version, "passive": passive, "spells": spells}


def dumps(document: dict[str, object]) -> str:
    """インデント 2・日本語のまま・末尾に改行 1 つ。"""
    return json.dumps(document, ensure_ascii=False, indent=2) + "\n"


def write_champion_file(directory: Path, champion_id: str, text: str) -> Path:
    """`<id>.json` を書く。改行は OS によらず LF。"""
    directory.mkdir(parents=True, exist_ok=True)
    path = directory / f"{champion_id}.json"
    body = text.encode("utf-8")
    if not path.exists() or path.read_bytes() != body:
        path.write_bytes(body)
    return path
