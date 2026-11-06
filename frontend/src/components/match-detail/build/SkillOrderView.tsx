import { NoData } from '@/components/champion-build';
import { formatSkillPriority } from '@/lib/champion-build';
import type { ParticipantBuild } from '@/types/matchDetail';
import { SkillLevelList } from './SkillLevelList';

interface SkillOrderViewProps {
  build: ParticipantBuild;
}

// スキルの最大化の順（例: Q > W > E）と、レベルごとの上げ順
export function SkillOrderView({ build }: SkillOrderViewProps) {
  if (build.skill_order.length === 0) return <NoData />;
  return (
    <div className="flex flex-col gap-3">
      <p className="flex items-baseline gap-2">
        <span className="text-sm text-fg-muted">最大化の順</span>
        <span className="text-xl font-bold text-fg">
          {formatSkillPriority(build.skill_priority)}
        </span>
      </p>
      <SkillLevelList skillOrder={build.skill_order} />
    </div>
  );
}
