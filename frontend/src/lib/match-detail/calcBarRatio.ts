/** 最大値に対する割合（0〜1）。最大値が0以下なら 0 */
export function calcBarRatio(value: number, max: number): number {
  if (max <= 0) return 0;
  return Math.min(Math.max(value / max, 0), 1);
}
