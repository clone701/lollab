/** HTTP ステータスと応答本文から、画面に出すエラーメッセージを決める */
export function toChampionBuildErrorMessage(
  status: number,
  body: unknown
): string {
  // 422 は championName の形式不正。FastAPI の detail は配列なので固定文言にする
  if (status === 422) return 'チャンピオンが見つかりません';
  const detail = (body as { detail?: unknown } | null)?.detail;
  if (typeof detail === 'string' && detail !== '') return detail;
  return `APIエラー: ${status}`;
}
