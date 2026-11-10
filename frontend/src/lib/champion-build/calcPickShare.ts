/** 採用率（0〜1）。選択肢の試合数 / その要素の集計対象の試合数。分母が 0 以下のときは 0 */
export function calcPickShare(
  optionGames: number,
  elementGames: number
): number {
  if (elementGames <= 0) return 0;
  return optionGames / elementGames;
}
