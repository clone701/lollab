"""scripts/skill_values/fetch.py のテスト（ネットワークは代役）。

_Requirements: 3.1_
"""

import json
import urllib.error
from pathlib import Path
from typing import Any

import pytest

from scripts.skill_values import fetch
from scripts.skill_values.fetch import Fetcher, cdragon_version


class FakeDownloader:
    """URL → 本文の代役。呼ばれた URL を覚える。"""

    def __init__(self, files: dict[str, Any]) -> None:
        self.files = files
        self.calls: list[str] = []

    def __call__(self, url: str) -> bytes | None:
        self.calls.append(url)
        body = self.files.get(url)
        return None if body is None else json.dumps(body).encode("utf-8")


BASE = "https://raw.communitydragon.org/16.21/game"
BIN_URL = f"{BASE}/data/characters/monkeyking/monkeyking.bin.json"
STRING_URL = f"{BASE}/ja_jp/data/menu/en_us/lol.stringtable.json"


def test_版は_data_dragon_の先頭2つ() -> None:
    assert cdragon_version("16.21.1") == "16.21"
    assert cdragon_version("14.1.1") == "14.1"
    with pytest.raises(ValueError):
        cdragon_version("latest")


def test_bin_は小文字の名前で取得して_版のフォルダにキャッシュする(
    tmp_path: Path,
) -> None:
    downloader = FakeDownloader({BIN_URL: {"a": 1}})
    fetcher = Fetcher(tmp_path, "16.21.1", downloader)
    assert fetcher.character_bin("MonkeyKing") == {"a": 1}
    assert downloader.calls == [BIN_URL]
    assert (tmp_path / "16.21" / "monkeyking.bin.json").exists()


def test_キャッシュがあれば取得しない(tmp_path: Path) -> None:
    downloader = FakeDownloader({BIN_URL: {"a": 1}})
    Fetcher(tmp_path, "16.21.1", downloader).character_bin("MonkeyKing")
    again = FakeDownloader({})
    assert Fetcher(tmp_path, "16.21.1", again).character_bin("MonkeyKing") == {"a": 1}
    assert again.calls == []


def test_見つからなければ_none_でキャッシュしない(tmp_path: Path) -> None:
    fetcher = Fetcher(tmp_path, "16.21.1", FakeDownloader({}))
    assert fetcher.character_bin("Nobody") is None
    assert not (tmp_path / "16.21" / "nobody.bin.json").exists()


def test_文字列表は_entries_のキーを小文字にする(tmp_path: Path) -> None:
    body = {"entries": {"Spell_UrgotQ_Tooltip": "文"}}
    fetcher = Fetcher(tmp_path, "16.21.1", FakeDownloader({STRING_URL: body}))
    assert fetcher.stringtable() == {"spell_urgotq_tooltip": "文"}


def test_文字列表が取れなければ失敗する(tmp_path: Path) -> None:
    fetcher = Fetcher(tmp_path, "16.21.1", FakeDownloader({}))
    with pytest.raises(RuntimeError):
        fetcher.stringtable()


class FakeResponse:
    def __init__(self, body: bytes) -> None:
        self.body = body

    def __enter__(self) -> "FakeResponse":
        return self

    def __exit__(self, *args: object) -> None:
        return None

    def read(self) -> bytes:
        return self.body


def http_error(code: int) -> urllib.error.HTTPError:
    return urllib.error.HTTPError("u", code, "m", None, None)  # type: ignore[arg-type]


def test_download_は_404_で_none(monkeypatch: pytest.MonkeyPatch) -> None:
    def fake_urlopen(*args: Any, **kwargs: Any) -> Any:
        raise http_error(404)

    monkeypatch.setattr(fetch.urllib.request, "urlopen", fake_urlopen)
    assert fetch.download("https://example.invalid/x") is None


def test_download_は一時的な失敗をやり直す(monkeypatch: pytest.MonkeyPatch) -> None:
    attempts: list[int] = []

    def fake_urlopen(*args: Any, **kwargs: Any) -> Any:
        attempts.append(1)
        if len(attempts) < 3:
            raise http_error(503)
        return FakeResponse(b"ok")

    monkeypatch.setattr(fetch.urllib.request, "urlopen", fake_urlopen)
    monkeypatch.setattr(fetch.time, "sleep", lambda seconds: None)
    assert fetch.download("https://example.invalid/x") == b"ok"
    assert len(attempts) == 3


def test_download_はやり直しても失敗すれば例外(monkeypatch: pytest.MonkeyPatch) -> None:
    def fake_urlopen(*args: Any, **kwargs: Any) -> Any:
        raise http_error(500)

    monkeypatch.setattr(fetch.urllib.request, "urlopen", fake_urlopen)
    monkeypatch.setattr(fetch.time, "sleep", lambda seconds: None)
    with pytest.raises(urllib.error.HTTPError):
        fetch.download("https://example.invalid/x")
