import { SkillIcon, SkillPriorityIcons } from '@/components/game-data';
import type { SkillInfo } from '@/lib/game-data';
import type { BuildElement } from '@/types/championBuild';
import { NoData } from './NoData';
import { OptionStat } from './OptionStat';
import { PanelSection } from './PanelSection';
import { SkillOrderGrid } from './SkillOrderGrid';

interface SkillPanelProps {
  /** パッシブと Q/W/E/R。読み込み前・失敗時は null */
  skills: SkillInfo[] | null;
  skillPriority: BuildElement;
  skillOrder: BuildElement;
}

// スキル画像は読み込み後に出す。読み込み前・失敗時は Q/W/E/R の文字のまま
export function SkillPanel({
  skills,
  skillPriority,
  skillOrder,
}: SkillPanelProps) {
  const passive = skills?.find((s) => s.key === 'P');
  const priority = skillPriority.options[0] ?? null;
  const order = skillOrder.options[0] ?? null;
  return (
    <PanelSection title="スキル">
      {passive && (
        <div className="flex items-center gap-2">
          <h3 className="text-sm text-fg-muted">パッシブ</h3>
          <SkillIcon skill={passive} fallbackKey="P" />
        </div>
      )}
      <div className="flex flex-col gap-1">
        <h3 className="text-sm text-fg-muted">優先順</h3>
        {priority ? (
          <div className="flex items-center gap-3">
            <SkillPriorityIcons priority={priority.key} skills={skills} />
            <OptionStat option={priority} />
          </div>
        ) : (
          <NoData />
        )}
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="text-sm text-fg-muted">スキル順（レベル1〜15）</h3>
        {order ? (
          <>
            <SkillOrderGrid skillKey={order.key} skills={skills} />
            <OptionStat option={order} />
          </>
        ) : (
          <NoData />
        )}
      </div>
    </PanelSection>
  );
}
