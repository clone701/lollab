import { Fragment } from 'react';
import { formatSkillPriority } from '@/lib/champion-build';
import type { SkillInfo } from '@/lib/game-data';
import { SkillSlotIcon } from './SkillSlotIcon';

interface SkillPriorityIconsProps {
  /** スキルの優先順。1=Q, 2=W, 3=E, 4=R */
  priority: number[];
  /** チャンピオンのスキル。読み込み前・失敗時は null（文字だけを出す） */
  skills: SkillInfo[] | null;
  size?: number;
}

// スキルの優先順を SkillIcon の並び（間に >）で出す。読み上げ用に「Q > W > E」を付ける
export function SkillPriorityIcons({
  priority,
  skills,
  size = 32,
}: SkillPriorityIconsProps) {
  return (
    <span
      role="group"
      aria-label={formatSkillPriority(priority)}
      className="inline-flex items-center gap-1.5"
    >
      {priority.map((slot, index) => (
        <Fragment key={index}>
          {index > 0 && (
            <span className="text-fg-subtle" aria-hidden="true">
              &gt;
            </span>
          )}
          <SkillSlotIcon slot={slot} skills={skills} size={size} />
        </Fragment>
      ))}
    </span>
  );
}
