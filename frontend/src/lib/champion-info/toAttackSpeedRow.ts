import type { DdragonChampionStats } from '@/lib/game-data';
import { calcAttackSpeedAtLevel } from './calcAttackSpeedAtLevel';
import { MAX_LEVEL } from './constants';
import { formatStat } from './formatStat';
import type { StatRow } from './types';

/** 攻撃速度の行。値は小数第3位まで出し、成長は % */
export function toAttackSpeedRow(stats: DdragonChampionStats): StatRow {
  const { attackspeed: base, attackspeedperlevel: growth } = stats;
  return {
    label: '攻撃速度',
    base: formatStat(base, 3),
    growth: `+${formatStat(growth)}%`,
    max: formatStat(calcAttackSpeedAtLevel(base, growth, MAX_LEVEL), 3),
  };
}
