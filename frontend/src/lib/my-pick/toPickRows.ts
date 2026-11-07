import { champions } from '@/lib/data/champions';
import type { PickRow } from '@/types/myPick';
import { normalizePicks } from './normalizePicks';

/**
 * 相手の id → ピック の対応を、保存用の行の配列にする。
 * ピックが空の行は含めない。champions.ts の並び順で返す。
 */
export function toPickRows(map: Record<string, string[]>): PickRow[] {
  const rows: PickRow[] = [];
  for (const champion of champions) {
    const picks = normalizePicks(map[champion.id] ?? []);
    if (picks.length > 0) {
      rows.push({ enemyChampionId: champion.id, pickChampionIds: picks });
    }
  }
  return rows;
}
