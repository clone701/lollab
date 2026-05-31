// お気に入りのlocalStorage管理（認証実装後はSupabaseに移行）
import type { Region } from '@/types/summoner';

export interface FavoriteEntry {
  name: string;
  tagLine: string;
  region: Region;
}

const STORAGE_KEY = 'lollab_favorites';
const MAX_FAVORITES = 10;

export function getFavorites(): FavoriteEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as FavoriteEntry[];
  } catch {
    return [];
  }
}

export function isFavoriteSummoner(
  name: string,
  tagLine: string,
  region: Region
): boolean {
  return getFavorites().some(
    (f) => f.name === name && f.tagLine === tagLine && f.region === region
  );
}

export function addFavorite(entry: FavoriteEntry): boolean {
  const favorites = getFavorites();
  if (favorites.length >= MAX_FAVORITES) return false;
  if (
    favorites.some(
      (f) =>
        f.name === entry.name &&
        f.tagLine === entry.tagLine &&
        f.region === entry.region
    )
  ) {
    return true;
  }
  favorites.push(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  return true;
}

export function removeFavorite(
  name: string,
  tagLine: string,
  region: Region
): void {
  const favorites = getFavorites().filter(
    (f) => !(f.name === name && f.tagLine === tagLine && f.region === region)
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
}
