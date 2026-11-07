/**
 * KDA の比率の文字色。表示と同じ小数第2位までで判定する。
 * 5.00 以上 highlight、4.00 以上 accent、3.00 以上 win、それ未満 fg-muted
 */
export function getKdaClass(kda: number): string {
  const shown = Number(kda.toFixed(2));
  if (shown >= 5) return 'text-highlight';
  if (shown >= 4) return 'text-accent';
  if (shown >= 3) return 'text-win';
  return 'text-fg-muted';
}
