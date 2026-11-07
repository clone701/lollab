import { getChampionById } from '@/lib/data/champions';
import { MAX_PICKS } from './constants';

/**
 * 枠 index にチャンピオンを入れる（新しい配列を返す）。
 * 既存の枠なら入れ替え、末尾以降なら末尾に追加する。
 * 同じ行に既にあるチャンピオン・champions.ts にない id・10を超える追加は拒否し、元の配列をそのまま返す。
 */
export function setPickAt(
  picks: string[],
  index: number,
  championId: string
): string[] {
  if (!getChampionById(championId)) return picks;
  if (index < 0 || index >= MAX_PICKS) return picks;
  if (picks.some((id, i) => id === championId && i !== index)) return picks;
  if (index < picks.length) {
    if (picks[index] === championId) return picks;
    return picks.map((id, i) => (i === index ? championId : id));
  }
  return [...picks, championId];
}
