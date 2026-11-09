import { formatStat } from './formatStat';
import type { StatRow } from './types';

/** 成長のない行（移動速度・射程）。Lv.1 の値だけ */
export function toFixedRow(label: string, value: number): StatRow {
  return { label, base: formatStat(value), growth: null, max: null };
}
