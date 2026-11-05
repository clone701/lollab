import type { Champion } from '@/types/champion';

function toHiragana(text: string): string {
  return text.replace(/[\u30a1-\u30f6]/g, (c) =>
    String.fromCharCode(c.charCodeAt(0) - 0x60)
  );
}

/**
 * 日本語名・読み（ひらがな）・英語 ID で絞り込む。英字は大文字小文字を区別しない。
 * カタカナで入力しても読みに一致する。
 */
export function filterChampions(
  champions: Champion[],
  query: string
): Champion[] {
  const q = query.trim().toLowerCase();
  if (q === '') return champions;
  const reading = toHiragana(q);
  return champions.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q) ||
      (c.reading?.includes(reading) ?? false)
  );
}
