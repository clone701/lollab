/** 試合カードの勝敗の表示。リメイクは勝敗の代わりに「リメイク」 */
export function getResultLabel(isWin: boolean, isRemake: boolean): string {
  if (isRemake) return 'リメイク';
  return isWin ? '勝利' : '敗北';
}
