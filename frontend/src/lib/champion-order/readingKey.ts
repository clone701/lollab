import type { Champion } from '@/types/champion';

/** 並べ替えのキー。読み（ひらがな）がなければ表示名を使う */
export function readingKey(champion: Champion): string {
  return champion.reading ?? champion.name;
}
