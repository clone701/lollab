/**
 * 勝率の文字のクラス。60% 以上は強調色の太字、50% 以上は勝利の色、50% 未満は敗北の色。
 * 丸める前の勝率で判定する（整数の比較で小数の誤差を避ける）
 */
export function getWinRateClass(wins: number, losses: number): string {
  const games = wins + losses;
  if (games > 0 && wins * 5 >= games * 3) return 'font-bold text-highlight';
  return wins >= losses ? 'text-win' : 'text-loss';
}
