import { getShards } from '@/lib/data/runes';
import type { Rune } from '@/lib/data/runes';

/** ステータスシャードの3行（攻撃・柔軟・防御） */
export function getShardRows(): Rune[][] {
  return [0, 1, 2].map((slot) => getShards(slot));
}
