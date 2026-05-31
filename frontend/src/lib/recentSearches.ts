// 最近の検索履歴のlocalStorage読み書きユーティリティ
import type { Region } from '@/types/summoner';

export interface RecentSearch {
  name: string;
  tagLine: string;
  region: Region;
  searchedAt: number;
}

const STORAGE_KEY = 'lollab_recent_searches';
const MAX_ENTRIES = 20;

export function getRecentSearches(): RecentSearch[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RecentSearch[];
  } catch {
    return [];
  }
}

export function addRecentSearch(entry: Omit<RecentSearch, 'searchedAt'>): void {
  const searches = getRecentSearches().filter(
    (s) =>
      !(
        s.name === entry.name &&
        s.tagLine === entry.tagLine &&
        s.region === entry.region
      )
  );
  searches.unshift({ ...entry, searchedAt: Date.now() });
  if (searches.length > MAX_ENTRIES) searches.length = MAX_ENTRIES;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(searches));
}

export function removeRecentSearch(
  name: string,
  tagLine: string,
  region: Region
): void {
  const searches = getRecentSearches().filter(
    (s) => !(s.name === name && s.tagLine === tagLine && s.region === region)
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(searches));
}
