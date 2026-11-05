// 経過秒数を「◯分前」「◯時間前」「◯日前」に変換する
export function formatTimeAgo(seconds: number): string {
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分前`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}時間前`;
  return `${Math.floor(seconds / 86400)}日前`;
}
