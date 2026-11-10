/**
 * 勝率や全体平均との差の文字色。基準以上は勝ち色、基準未満は負け色。
 * 試合数が 0 のときは値が意味を持たないため本文色にする
 */
export function rateColorClass(
  value: number,
  baseline: number,
  hasGames: boolean
): string {
  if (!hasGames) return 'text-fg';
  return value >= baseline ? 'text-win' : 'text-loss';
}
