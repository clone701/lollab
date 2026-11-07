import { formatCsPerMinute } from '@/lib/match-detail';

/** CS の表示。分あたりは小数1桁（例: CS 157 (7.1)） */
export function formatCsLabel(cs: number, durationSeconds: number): string {
  return `CS ${cs} (${formatCsPerMinute(cs, durationSeconds)})`;
}
