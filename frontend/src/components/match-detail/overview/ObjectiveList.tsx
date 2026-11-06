import { OBJECTIVES } from '@/lib/match-detail';
import type { TeamPair } from '@/lib/match-detail';

interface ObjectiveListProps {
  pair: TeamPair;
}

// オブジェクトの獲得数（ブルー - レッド）
export function ObjectiveList({ pair }: ObjectiveListProps) {
  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {OBJECTIVES.map(({ key, label }) => (
        <li
          key={key}
          className="flex items-center justify-between rounded bg-surface-2 px-2 py-1 text-xs"
        >
          <span className="text-fg-muted">{label}</span>
          <span className="font-medium text-fg">
            {pair.blue.objectives[key] ?? 0} - {pair.red.objectives[key] ?? 0}
          </span>
        </li>
      ))}
    </ul>
  );
}
