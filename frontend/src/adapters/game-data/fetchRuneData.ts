import type { DdragonRuneData } from '@/lib/game-data';
import { GAME_DATA_BASE_PATH } from './constants';
import { loadOnce } from './loadOnce';

/** ルーンのデータ（runesReforged.json）を取得する */
export function fetchRuneData(): Promise<DdragonRuneData> {
  return loadOnce<DdragonRuneData>(`${GAME_DATA_BASE_PATH}/runesReforged.json`);
}
