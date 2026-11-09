import { formatCooldown, formatCost } from '@/lib/game-data';
import type { SkillInfo } from '@/lib/game-data';
import { TooltipBody } from './TooltipBody';

interface SkillTooltipContentProps {
  skill: SkillInfo;
}

// スキルは [Q] 名前、クールダウン、コスト（無ければ行なし）、説明
export function SkillTooltipContent({ skill }: SkillTooltipContentProps) {
  const cooldown =
    skill.cooldownBurn === null
      ? undefined
      : formatCooldown(skill.cooldownBurn);
  const cost =
    skill.costBurn === null
      ? undefined
      : (formatCost(skill.costBurn, skill.partype) ?? undefined);
  return (
    <TooltipBody
      title={`[${skill.key}] ${skill.name}`}
      iconSrc={skill.imagePath}
      meta={cooldown}
      subline={cost}
      description={skill.description}
    />
  );
}
