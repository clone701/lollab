import { formatSkillPriority, selectOption } from '@/lib/champion-build';
import type { BuildElement, BuildMode } from '@/types/championBuild';
import { NoData } from './NoData';
import { OptionStat } from './OptionStat';
import { PanelSection } from './PanelSection';
import { SkillOrderGrid } from './SkillOrderGrid';

interface SkillPanelProps {
  skillPriority: BuildElement;
  skillOrder: BuildElement;
  mode: BuildMode;
}

// スキルアイコンは Data Dragon の champion JSON が必要になるため、Q/W/E/R の文字で表示する
export function SkillPanel({
  skillPriority,
  skillOrder,
  mode,
}: SkillPanelProps) {
  const priority = selectOption(skillPriority, mode);
  const order = selectOption(skillOrder, mode);
  return (
    <PanelSection title="スキル">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm text-fg-muted">優先順</h3>
        {priority ? (
          <div className="flex items-baseline gap-3">
            <span className="text-xl font-bold text-fg">
              {formatSkillPriority(priority.key)}
            </span>
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
            <SkillOrderGrid skillKey={order.key} />
            <OptionStat option={order} />
          </>
        ) : (
          <NoData />
        )}
      </div>
    </PanelSection>
  );
}
