import { NoData } from '@/components/champion-build';
import { SkillPriorityIcons, useChampionDetail } from '@/components/game-data';
import { toChampionId } from '@/lib/match-detail';
import type { ParticipantBuild } from '@/types/matchDetail';
import { SkillLevelList } from './SkillLevelList';

interface SkillOrderViewProps {
  build: ParticipantBuild;
  /** Riot の championName。スキル画像の取得に使う */
  championName: string;
}

// スキルの最大化の順（例: Q > W > E）と、レベルごとの上げ順
export function SkillOrderView({ build, championName }: SkillOrderViewProps) {
  const isEmpty = build.skill_order.length === 0;
  const { skills } = useChampionDetail(
    isEmpty ? null : toChampionId(championName)
  );
  if (isEmpty) return <NoData />;
  return (
    <div className="flex flex-col gap-3">
      <p className="flex items-center gap-2">
        <span className="text-sm text-fg-muted">最大化の順</span>
        <SkillPriorityIcons priority={build.skill_priority} skills={skills} />
      </p>
      <SkillLevelList skillOrder={build.skill_order} skills={skills} />
    </div>
  );
}
