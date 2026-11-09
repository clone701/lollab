import { toDdragonChampionKey } from '@/lib/game-data';
import type { DdragonChampionData } from '@/lib/game-data';
import { GAME_DATA_BASE_PATH } from './constants';
import { loadOnce } from './loadOnce';

/** チャンピオン1体分のデータを取得する。championId は champions.ts の id（Wukong → MonkeyKing.json） */
export function fetchChampionData(
  championId: string
): Promise<DdragonChampionData> {
  const key = encodeURIComponent(toDdragonChampionKey(championId));
  return loadOnce<DdragonChampionData>(
    `${GAME_DATA_BASE_PATH}/champion/${key}.json`
  );
}
