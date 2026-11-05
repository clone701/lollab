/** 勝率（0〜1）。試合数が 0 のときは 0 */
export function calcWinRate(wins: number, games: number): number {
  if (games <= 0) return 0;
  return wins / games;
}
