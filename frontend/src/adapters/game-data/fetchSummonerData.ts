import type { DdragonSummonerData } from '@/lib/game-data';
import { GAME_DATA_BASE_PATH } from './constants';
import { loadOnce } from './loadOnce';

/** サモナースペルのデータ（summoner.json）を取得する */
export function fetchSummonerData(): Promise<DdragonSummonerData> {
  return loadOnce<DdragonSummonerData>(`${GAME_DATA_BASE_PATH}/summoner.json`);
}
