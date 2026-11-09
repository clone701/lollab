"""CommunityDragon のデータの取得とキャッシュ。

取得したファイルは ``<cache>/<版>/`` に置き、次の実行では取得しない。
ネットワークの取得関数は差し替えられる（テストでは代役を渡す）。
"""

import json
import logging
import re
import time
import urllib.error
import urllib.request
from collections.abc import Callable
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

BASE_URL = "https://raw.communitydragon.org"
STRINGTABLE_PATH = "game/ja_jp/data/menu/en_us/lol.stringtable.json"
STRINGTABLE_FILE = "lol.stringtable.json"
USER_AGENT = "lollab-skill-values"

# URL を受け取って本文を返す関数。見つからないときは None（404）
Downloader = Callable[[str], bytes | None]


def cdragon_version(ddragon_version: str) -> str:
    """Data Dragon の版を CommunityDragon の版にする（16.21.1 → 16.21）。"""
    match = re.fullmatch(r"(\d+)\.(\d+)(?:\.\d+)*", ddragon_version)
    if match is None:
        raise ValueError(f"版の形式が正しくありません: {ddragon_version}")
    return f"{match.group(1)}.{match.group(2)}"


def download(url: str, retries: int = 3, timeout: int = 300) -> bytes | None:
    """URL を取得する。404 は None。一時的な失敗は数回やり直す。"""
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:
                return bytes(response.read())
        except urllib.error.HTTPError as error:
            if error.code == 404:
                return None
            if attempt == retries - 1:
                raise
        except (urllib.error.URLError, TimeoutError):
            if attempt == retries - 1:
                raise
        time.sleep(2 * (attempt + 1))
    return None


class Fetcher:
    """版ごとのキャッシュを持つ取得役。"""

    def __init__(
        self,
        cache_dir: Path,
        ddragon_version: str,
        downloader: Downloader = download,
    ) -> None:
        self.version = cdragon_version(ddragon_version)
        self.cache = cache_dir / self.version
        self.downloader = downloader

    def _load(self, file_name: str, url: str) -> Any | None:
        """キャッシュにあればそれを、無ければ取得して保存して返す。"""
        path = self.cache / file_name
        if not path.exists():
            body = self.downloader(url)
            if body is None:
                logger.warning("見つかりません: %s", url)
                return None
            self.cache.mkdir(parents=True, exist_ok=True)
            path.write_bytes(body)
        return json.loads(path.read_text(encoding="utf-8"))

    def character_bin(self, key: str) -> dict[str, Any] | None:
        """チャンピオンの bin.json。Key は大文字小文字どちらでもよい。"""
        lower = key.lower()
        url = f"{BASE_URL}/{self.version}/game/data/characters/{lower}/{lower}.bin.json"
        data = self._load(f"{lower}.bin.json", url)
        return data if isinstance(data, dict) else None

    def stringtable(self) -> dict[str, str]:
        """日本語の文字列表（キーは小文字）。"""
        url = f"{BASE_URL}/{self.version}/{STRINGTABLE_PATH}"
        data = self._load(STRINGTABLE_FILE, url)
        if not isinstance(data, dict):
            raise RuntimeError("文字列表を取得できませんでした")
        entries = data.get("entries", data)
        return {str(k).lower(): str(v) for k, v in entries.items()}
