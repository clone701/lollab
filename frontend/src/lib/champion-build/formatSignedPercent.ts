/** 0〜1 の差を符号付き % にする（例: 0.0123 → "+1.2%"、-0.008 → "-0.8%"） */
export function formatSignedPercent(ratio: number, digits = 1): string {
  if (!Number.isFinite(ratio)) return '-';
  const percent = Number((ratio * 100).toFixed(digits));
  const sign = percent > 0 ? '+' : '';
  return `${sign}${percent.toFixed(digits)}%`;
}
