import { formatCooldown, formatCost } from '@/lib/game-data';
import type { SkillInfo } from '@/lib/game-data';

/** スキル1つの CD・コスト・射程の表示。出さないものは null */
export interface SkillMeta {
  cooldown: string | null;
  cost: string | null;
  range: string | null;
}

/** パッシブ（値が null）、コスト 0、射程 0 は出さない */
export function toSkillMeta(skill: SkillInfo): SkillMeta {
  const { cooldownBurn, costBurn, rangeBurn } = skill;
  return {
    cooldown: cooldownBurn === null ? null : formatCooldown(cooldownBurn),
    cost: costBurn === null ? null : formatCost(costBurn, skill.partype),
    range: rangeBurn === null || rangeBurn === '0' ? null : rangeBurn,
  };
}
