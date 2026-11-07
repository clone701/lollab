/** 見出し。年があれば「S2026 使用チャンピオン」、なければ「使用チャンピオン」 */
export function formatStatsTitle(year: number | null): string {
  return year === null ? '使用チャンピオン' : `S${year} 使用チャンピオン`;
}
