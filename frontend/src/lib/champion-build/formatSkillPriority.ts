import { SKILL_LABELS } from './constants';

/** スキル優先順のキーを表記にする（例: [1,2,3] → "Q > W > E"） */
export function formatSkillPriority(key: number[]): string {
  return key.map((k) => SKILL_LABELS[k - 1] ?? '?').join(' > ');
}
