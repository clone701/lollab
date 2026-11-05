import { DOMINATION_RUNES } from './domination';
import { INSPIRATION_RUNES } from './inspiration';
import { PRECISION_RUNES } from './precision';
import { RESOLVE_RUNES } from './resolve';
import { STAT_SHARDS } from './shards';
import { SORCERY_RUNES } from './sorcery';
import { RUNE_STYLES } from './styles';
import type { RuneIconTable } from './types';

export interface RuneIcon {
  name: string;
  src: string;
}

const STYLES_DIR = '/images/runes/Styles/';
const SHARDS_DIR = '/images/runes/StatMods/';

/** 検索順。各テーブルの相対パスは dir からの相対 */
const SOURCES: { table: RuneIconTable; dir: string }[] = [
  { table: PRECISION_RUNES, dir: STYLES_DIR },
  { table: DOMINATION_RUNES, dir: STYLES_DIR },
  { table: SORCERY_RUNES, dir: STYLES_DIR },
  { table: RESOLVE_RUNES, dir: STYLES_DIR },
  { table: INSPIRATION_RUNES, dir: STYLES_DIR },
  { table: RUNE_STYLES, dir: STYLES_DIR },
  { table: STAT_SHARDS, dir: SHARDS_DIR },
];

/** ルーン・スタイル・ステータスシャードの ID から画像を引く。未知の ID は null */
export function getRuneIcon(id: number): RuneIcon | null {
  for (const { table, dir } of SOURCES) {
    const entry = table[id];
    if (entry) return { name: entry[0], src: `${dir}${entry[1]}` };
  }
  return null;
}
