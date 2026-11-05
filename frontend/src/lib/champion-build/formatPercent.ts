/** 0〜1 の比率を % 表記にする（例: 0.5234 → "52.3%"） */
export function formatPercent(ratio: number, digits = 1): string {
  if (!Number.isFinite(ratio)) return '-';
  return `${(ratio * 100).toFixed(digits)}%`;
}
