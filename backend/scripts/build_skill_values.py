"""スキルの数値入りの説明文を作る（CommunityDragon のデータを計算する）。

使い方（リポジトリのルートから）:
    python backend/scripts/build_skill_values.py D:\\dev\\16.21.1 \\
        --cache D:\\dev\\cdragon

結果は frontend/public/data/skills/<チャンピオンの id>.json に書く。
"""

import argparse
import sys
from collections.abc import Sequence
from pathlib import Path

# `python backend/scripts/build_skill_values.py` で実行したときに scripts を読めるようにする
BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from scripts.skill_values import output  # noqa: E402
from scripts.skill_values.champion import (  # noqa: E402
    read_champion_info,
    solve_champion,
)
from scripts.skill_values.fetch import (  # noqa: E402
    Downloader,
    Fetcher,
    download,
)
from scripts.skill_values.report import (  # noqa: E402
    SLOT_NAMES,
    Tally,
    format_report,
)

REPO_ROOT = BACKEND_DIR.parent
DEFAULT_OUTPUT = REPO_ROOT / "frontend" / "public" / "data" / "skills"


def build(
    ddragon_dir: Path,
    cache_dir: Path,
    output_dir: Path,
    downloader: Downloader = download,
) -> Tally:
    """全チャンピオンの結果のファイルを書き、集計を返す。"""
    version = ddragon_dir.name
    fetcher = Fetcher(cache_dir, version, downloader)
    strings = fetcher.stringtable()
    tally = Tally()
    champion_dir = ddragon_dir / "data" / "ja_JP" / "champion"
    for path in sorted(champion_dir.glob("*.json")):
        info = read_champion_info(path)
        result = solve_champion(
            info, fetcher.character_bin(info.id), strings, tally.add_reason
        )
        for slot, text in zip(SLOT_NAMES, [result.passive, *result.spells]):
            tally.add(slot, text)
        document = output.build_document(version, result.passive, result.spells)
        output.write_champion_file(output_dir, info.id, output.dumps(document))
    return tally


def main(argv: Sequence[str] | None = None, downloader: Downloader = download) -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("ddragon_dir", type=Path, help="Data Dragon の版のフォルダ")
    parser.add_argument(
        "--cache", type=Path, required=True, help="取得したファイルの置き場"
    )
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args(argv)
    tally = build(args.ddragon_dir, args.cache, args.output, downloader)
    print(format_report(tally))
    return 0


if __name__ == "__main__":
    sys.exit(main())
