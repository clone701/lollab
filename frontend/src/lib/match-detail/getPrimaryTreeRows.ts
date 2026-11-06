import { getKeystones, getPrimaryRunes } from '@/lib/data/runes';
import type { Rune } from '@/lib/data/runes';

/** メインツリーの行: キーストーン、続く3行のルーン。未知のツリーは空 */
export function getPrimaryTreeRows(styleId: number): Rune[][] {
  const keystones = getKeystones(styleId);
  if (keystones.length === 0) return [];
  return [
    keystones,
    ...[0, 1, 2].map((slot) => getPrimaryRunes(styleId, slot)),
  ];
}
