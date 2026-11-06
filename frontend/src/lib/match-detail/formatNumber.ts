/** 3桁区切りの数値表記（ダメージ・ゴールド用。環境の言語に依存させない） */
export function formatNumber(value: number): string {
  return value.toLocaleString('en-US');
}
