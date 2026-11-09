import type { DdragonChampionStats } from '@/lib/game-data';
import { toAttackSpeedRow } from './toAttackSpeedRow';
import { toFixedRow } from './toFixedRow';
import { toStatRow } from './toStatRow';
import type { StatRow } from './types';

const NO_RESOURCE = 'なし';

/** ステータス表の行を作る。リソースが「なし」なら、リソースの行は除く */
export function toStatRows(
  stats: DdragonChampionStats,
  partype: string
): StatRow[] {
  const s = stats;
  const hasResource = partype !== NO_RESOURCE;
  const rows: (StatRow | false)[] = [
    toStatRow('体力', s.hp, s.hpperlevel),
    hasResource && toStatRow(partype, s.mp, s.mpperlevel),
    toStatRow('物理防御', s.armor, s.armorperlevel),
    toStatRow('魔法防御', s.spellblock, s.spellblockperlevel),
    toFixedRow('移動速度', s.movespeed),
    toStatRow('攻撃力', s.attackdamage, s.attackdamageperlevel),
    toAttackSpeedRow(s),
    toStatRow('体力自動回復', s.hpregen, s.hpregenperlevel),
    hasResource &&
      toStatRow(`${partype}自動回復`, s.mpregen, s.mpregenperlevel),
    toFixedRow('射程', s.attackrange),
  ];
  return rows.filter((row): row is StatRow => row !== false);
}
