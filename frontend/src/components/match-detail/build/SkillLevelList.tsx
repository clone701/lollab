import { SkillSlotIcon } from '@/components/game-data';
import { SKILL_LABELS } from '@/lib/champion-build';
import type { SkillInfo } from '@/lib/game-data';

interface SkillLevelListProps {
  /** レベルごとに上げたスキル。1=Q, 2=W, 3=E, 4=R */
  skillOrder: number[];
  /** マスの画像に使う。読み込み前・失敗時は null（文字だけを出す） */
  skills: SkillInfo[] | null;
}

// レベルごとの Q/W/E/R。R は強調する
export function SkillLevelList({ skillOrder, skills }: SkillLevelListProps) {
  return (
    <ol className="flex flex-wrap gap-1">
      {skillOrder.map((slot, i) => {
        const label = SKILL_LABELS[slot - 1] ?? '?';
        return (
          <li key={i} className="flex flex-col items-center gap-0.5">
            <span className="text-xs text-fg-subtle">{i + 1}</span>
            <span
              aria-label={`レベル${i + 1}: ${label}`}
              data-skill={label}
              className={`flex h-7 w-7 items-center justify-center rounded text-sm ${
                label === 'R'
                  ? 'font-bold text-highlight ring-2 ring-highlight'
                  : 'bg-surface text-fg'
              }`}
            >
              <SkillSlotIcon slot={slot} skills={skills} size={28} />
            </span>
          </li>
        );
      })}
    </ol>
  );
}
