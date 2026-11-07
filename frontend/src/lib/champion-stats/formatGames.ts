/** 試合数の表示（例: 92 試合） */
export function formatGames(wins: number, losses: number): string {
  return `${wins + losses} 試合`;
}
