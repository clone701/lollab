import { getChampionById } from '@/lib/data/champions';
import { MAX_PICKS } from './constants';

/**
 * ピックを保存できる形にそろえる。
 * champions.ts にない id と重複を除き、順番を保ったまま先頭から最大10個にする。
 */
export function normalizePicks(picks: string[]): string[] {
  const result: string[] = [];
  for (const id of picks) {
    if (result.length >= MAX_PICKS) break;
    if (result.includes(id) || !getChampionById(id)) continue;
    result.push(id);
  }
  return result;
}
