import type { Champion } from '@/types/champion';

/** 並べ替えのキー。読み（ひらがな）がなければ表示名を使う */
export function readingKey(champion: Champion): string {
  return champion.reading ?? champion.name;
}

/** チャンピオンを日本語の読みの五十音順に並べた新しい配列を返す */
export function sortByReading(list: readonly Champion[]): Champion[] {
  return [...list].sort((a, b) =>
    readingKey(a).localeCompare(readingKey(b), 'ja')
  );
}
