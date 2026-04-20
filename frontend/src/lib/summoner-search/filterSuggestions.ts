import type { SuggestCandidate, Region } from '@/types/summoner';

/**
 * クエリ文字列でサジェスト候補をフィルタリングする純粋関数
 * - クエリを小文字化して名前の前方一致で絞り込む
 * - region が指定された場合はその地域の候補を優先（先頭に）する
 * @param candidates 全候補リスト
 * @param query 入力クエリ（`#` 以前の名前部分で比較）
 * @param region 選択中の地域（優先表示用）
 * @param limit 最大表示件数（デフォルト5）
 */
export function filterSuggestions(
  candidates: SuggestCandidate[],
  query: string,
  region: Region,
  limit = 5
): SuggestCandidate[] {
  const normalizedQuery = query.split('#')[0].trim().toLowerCase();
  if (normalizedQuery === '') return [];

  const matched = candidates.filter((c) =>
    c.name.toLowerCase().includes(normalizedQuery)
  );

  // 選択地域を先頭に
  const sameRegion = matched.filter((c) => c.region === region);
  const otherRegion = matched.filter((c) => c.region !== region);

  return [...sameRegion, ...otherRegion].slice(0, limit);
}
