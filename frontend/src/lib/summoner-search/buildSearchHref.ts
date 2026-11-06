import type { Region } from '@/types/summoner';

/** サモナー検索結果の URL（トップページのクエリ）。query は `gameName#tagLine` */
export function buildSearchHref(region: Region, query: string): string {
  return `/?region=${region}&q=${encodeURIComponent(query)}`;
}
