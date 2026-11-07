/** 平均のキル / デス / アシストの表示（例: 6.4 / 4.8 / 6.7） */
export function formatKdaBreakdown(
  kills: number,
  deaths: number,
  assists: number
): string {
  return [kills, deaths, assists].map((n) => n.toFixed(1)).join(' / ');
}
