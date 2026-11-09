import type { DdragonItemData } from '@/lib/game-data';
import { GAME_DATA_BASE_PATH } from './constants';
import { loadOnce } from './loadOnce';

/** アイテムのデータ（item.json）を取得する */
export function fetchItemData(): Promise<DdragonItemData> {
  return loadOnce<DdragonItemData>(`${GAME_DATA_BASE_PATH}/item.json`);
}
