/** 勝率の表示（例: 57 %）。四捨五入した整数。試合がなければ 0 % */
export function formatWinRate(wins: number, losses: number): string {
  const games = wins + losses;
  const percent = games > 0 ? Math.round((wins / games) * 100) : 0;
  return `${percent} %`;
}
