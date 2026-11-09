import type { Champion } from '@/types/champion';
import { readingKey } from './readingKey';

/** チャンピオンを日本語の読みの五十音順に並べた新しい配列を返す */
export function sortByReading(list: readonly Champion[]): Champion[] {
  return [...list].sort((a, b) =>
    readingKey(a).localeCompare(readingKey(b), 'ja')
  );
}
