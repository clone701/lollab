/** ステータスの値を、小数第 digits 位まで（四捨五入）、末尾の 0 なしで書く */
export function formatStat(n: number, digits = 2): string {
  const scale = 10 ** digits;
  const rounded = Math.round((n + Number.EPSILON) * scale) / scale;
  return String(rounded);
}
