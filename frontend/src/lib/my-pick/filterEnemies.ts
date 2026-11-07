import { filterChampions } from '@/lib/champion-build';
import type { Champion } from '@/types/champion';

/**
 * 相手チャンピオンの行を絞り込む。
 * query は日本語名・読み・英語名、isFilledOnly はピックが1つ以上ある行だけを残す。
 */
export function filterEnemies(
  champions: Champion[],
  picksByEnemy: Record<string, string[]>,
  query: string,
  isFilledOnly: boolean
): Champion[] {
  const matched = filterChampions(champions, query);
  if (!isFilledOnly) return matched;
  return matched.filter((c) => (picksByEnemy[c.id]?.length ?? 0) > 0);
}
