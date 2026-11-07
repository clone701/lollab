/** 試合カードの勝敗の文字色。リメイクは控えめな色 */
export function getResultClass(isWin: boolean, isRemake: boolean): string {
  if (isRemake) return 'text-fg-muted';
  return isWin ? 'text-win' : 'text-loss';
}
