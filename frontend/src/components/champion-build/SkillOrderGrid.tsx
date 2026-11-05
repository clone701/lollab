import {
  SKILL_LABELS,
  SKILL_ORDER_LEVELS,
  toSkillGrid,
} from '@/lib/champion-build';

interface SkillOrderGridProps {
  skillKey: number[];
}

// 行: Q/W/E/R、列: レベル1〜15。そのレベルで上げるスキルのマスを塗る
export function SkillOrderGrid({ skillKey }: SkillOrderGridProps) {
  const grid = toSkillGrid(skillKey);
  const levels = Array.from({ length: SKILL_ORDER_LEVELS }, (_, i) => i + 1);
  return (
    <div className="overflow-x-auto">
      <table className="border-separate border-spacing-0.5 text-xs">
        <thead>
          <tr>
            <th />
            {levels.map((lv) => (
              <th key={lv} className="w-6 font-medium text-fg-muted">
                {lv}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SKILL_LABELS.map((label, row) => (
            <tr key={label}>
              <th className="pr-1 font-semibold text-fg">{label}</th>
              {grid[row].map((isActive, col) => (
                <td
                  key={col}
                  aria-label={
                    isActive ? `レベル${col + 1}: ${label}` : undefined
                  }
                  className={`h-6 w-6 rounded text-center ${isActive ? 'bg-action font-bold text-white' : 'bg-surface-2'}`}
                >
                  {isActive ? label : ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
