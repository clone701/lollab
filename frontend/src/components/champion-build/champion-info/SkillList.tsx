import type { SkillInfo } from '@/lib/game-data';
import { SkillRow } from './SkillRow';

interface SkillListProps {
  /** パッシブと Q/W/E/R の順 */
  skills: SkillInfo[];
}

export function SkillList({ skills }: SkillListProps) {
  return (
    <ul aria-label="スキル" className="flex flex-col gap-2">
      {skills.map((skill) => (
        <li key={skill.key}>
          <SkillRow skill={skill} />
        </li>
      ))}
    </ul>
  );
}
