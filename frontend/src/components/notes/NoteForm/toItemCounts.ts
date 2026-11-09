import { STARTER_ITEMS } from '@/lib/data/items';
import type { Item } from '@/lib/data/items';

/** アイテム ID の配列を、アイテムごとの個数にまとめる（一覧に無い ID は除く） */
export function toItemCounts(ids: string[]): { item: Item; count: number }[] {
  const counts: Record<string, number> = {};
  ids.forEach((id) => {
    counts[id] = (counts[id] || 0) + 1;
  });
  return Object.entries(counts).flatMap(([id, count]) => {
    const item = STARTER_ITEMS.find((i) => i.id === id);
    return item ? [{ item, count }] : [];
  });
}
