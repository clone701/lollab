/** CS の表示。平均 CS は整数、かっこ内は分あたりの平均 CS（例: CS 198 (6.9)） */
export function formatCs(cs: number, csPerMinute: number): string {
  return `CS ${Math.round(cs)} (${csPerMinute.toFixed(1)})`;
}
