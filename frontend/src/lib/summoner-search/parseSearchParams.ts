import type { Region } from '@/types/summoner';
import { REGION_DEFAULT_TAGS } from '@/types/summoner';
import { validateSummonerName } from './validateSummonerName';

export interface SearchParams {
  region: Region;
  query: string;
}

/** URL の region・q を検索条件にする。どちらかが不正・なしなら null（検索画面を出す） */
export function parseSearchParams(
  region: string | null,
  q: string | null
): SearchParams | null {
  if (!region || !Object.keys(REGION_DEFAULT_TAGS).includes(region)) {
    return null;
  }
  if (q === null) return null;
  const query = q.trim();
  if (validateSummonerName(query) !== null) return null;
  return { region: region as Region, query };
}
