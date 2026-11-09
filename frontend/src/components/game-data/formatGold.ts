/** ゴールドを表示用にする。例: 3250 → '3,250 ゴールド' */
export function formatGold(gold: number): string {
  return `${gold.toLocaleString('en-US')} ゴールド`;
}
