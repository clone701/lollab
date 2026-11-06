/** 分あたりの CS（小数1桁）。試合時間が0秒以下なら 0.0 */
export function formatCsPerMinute(cs: number, durationSeconds: number): string {
  if (durationSeconds <= 0) return '0.0';
  return (cs / (durationSeconds / 60)).toFixed(1);
}
