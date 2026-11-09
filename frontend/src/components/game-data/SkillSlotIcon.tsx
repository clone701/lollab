import { SKILL_LABELS } from '@/lib/champion-build';
import type { SkillInfo } from '@/lib/game-data';
import { SkillIcon } from './SkillIcon';

interface SkillSlotIconProps {
  /** スキルの番号。1=Q, 2=W, 3=E, 4=R */
  slot: number;
  /** チャンピオンのスキル。読み込み前・失敗時は null（文字だけを出す） */
  skills: SkillInfo[] | null;
  size?: number;
}

// 番号で指したスキルの SkillIcon。番号が範囲外なら「?」を出す
export function SkillSlotIcon({ slot, skills, size }: SkillSlotIconProps) {
  const key = SKILL_LABELS[slot - 1];
  if (!key) return <span>?</span>;
  const skill = skills?.find((s) => s.key === key) ?? null;
  return <SkillIcon skill={skill} fallbackKey={key} size={size} />;
}
