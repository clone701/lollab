import type { ChampionStatData } from '@/types/summoner';
import { INITIAL_VISIBLE_COUNT } from './constants';

/** 表示するチャンピオン。展開していなければ先頭の INITIAL_VISIBLE_COUNT 件、展開していれば全件 */
export function getVisibleChampions(
  champions: ChampionStatData[],
  isExpanded: boolean
): ChampionStatData[] {
  return isExpanded ? champions : champions.slice(0, INITIAL_VISIBLE_COUNT);
}
