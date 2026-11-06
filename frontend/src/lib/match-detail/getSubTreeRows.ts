import { getKeystones, getPrimaryRunes } from '@/lib/data/runes';
import type { Rune } from '@/lib/data/runes';

/** サブツリーの行: キーストーンを除く3行のルーン。未知のツリーは空 */
export function getSubTreeRows(styleId: number): Rune[][] {
  if (getKeystones(styleId).length === 0) return [];
  return [0, 1, 2].map((slot) => getPrimaryRunes(styleId, slot));
}
