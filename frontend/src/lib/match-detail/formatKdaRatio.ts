/** KDA の比率 (キル + アシスト) / デス。デスが0なら「Perfect」 */
export function formatKdaRatio(
  kills: number,
  deaths: number,
  assists: number
): string {
  if (deaths === 0) return 'Perfect';
  return `${((kills + assists) / deaths).toFixed(2)}:1`;
}
