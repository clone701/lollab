import { getOwn } from './getOwn';
import type { DdragonItemData, ItemInfo } from './types';

/** アイテム ID から画面用の情報を作る。無ければ null */
export function toItemInfo(
  data: DdragonItemData,
  id: number | string
): ItemInfo | null {
  const item = getOwn(data.data, String(id));
  if (!item) return null;
  return {
    name: item.name,
    totalGold: item.gold.total,
    description: item.description,
  };
}
