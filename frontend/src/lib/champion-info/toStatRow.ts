import { MAX_LEVEL } from './constants';
import { calcStatAtLevel } from './calcStatAtLevel';
import { formatStat } from './formatStat';
import type { StatRow } from './types';

/** 成長のあるステータスの行（Lv.1・成長・Lv.18）を作る */
export function toStatRow(
  label: string,
  base: number,
  growth: number
): StatRow {
  return {
    label,
    base: formatStat(base),
    growth: `+${formatStat(growth)}`,
    max: formatStat(calcStatAtLevel(base, growth, MAX_LEVEL)),
  };
}
