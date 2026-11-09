import { DescriptionText, SkillIcon } from '@/components/game-data';
import { toSkillMeta } from '@/lib/champion-info';
import type { SkillInfo } from '@/lib/game-data';
import { SkillStat } from './SkillStat';

interface SkillRowProps {
  skill: SkillInfo;
}

// スキル1行: アイコン・キー・名前、右に CD・コスト・射程、下に説明文（数値入り。無ければ概要）
export function SkillRow({ skill }: SkillRowProps) {
  const { cooldown, cost, range } = toSkillMeta(skill);
  return (
    <div className="rounded-lg bg-surface-2 p-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <SkillIcon skill={skill} fallbackKey={skill.key} size={40} />
        <h3 className="flex items-baseline gap-2 text-sm font-semibold">
          {/* キーはアイコンの右下にも出るので、見た目では隠して読み上げだけに残す */}
          <span className="sr-only">{skill.key}</span>
          <span className="text-highlight">{skill.name}</span>
        </h3>
        <dl className="ml-auto flex flex-wrap gap-x-3 text-xs">
          {cooldown && <SkillStat label="CD" value={cooldown} />}
          {cost && <SkillStat label="コスト" value={cost} />}
          {range && <SkillStat label="射程" value={range} />}
        </dl>
      </div>
      <div className="mt-2 text-sm text-fg">
        <DescriptionText html={skill.detail ?? skill.description} />
      </div>
    </div>
  );
}
