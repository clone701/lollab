import type { PickRow } from '@/types/myPick';
import { normalizePicks } from './normalizePicks';

/** 行の配列を 相手の id → ピック の対応にする（ピックが空になる行は含めない） */
export function toPickMap(rows: PickRow[]): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const row of rows) {
    const picks = normalizePicks(row.pickChampionIds);
    if (picks.length > 0) map[row.enemyChampionId] = picks;
  }
  return map;
}
