import { CHAMPION_STATS_TABS } from '@/lib/champion-stats';
import type { ChampionStatsQueue } from '@/types/summoner';

interface ChampionStatTabsProps {
  selected: ChampionStatsQueue;
  onSelect: (queue: ChampionStatsQueue) => void;
}

const SELECTED = 'ring-2 ring-accent bg-accent/15';
const NORMAL = 'bg-surface-2 hover:ring-2 hover:ring-accent/60';

// キューの切り替え（全体・ソロランク・フレックス）
export function ChampionStatTabs({
  selected,
  onSelect,
}: ChampionStatTabsProps) {
  return (
    <div role="group" aria-label="キュー" className="flex flex-wrap gap-2">
      {CHAMPION_STATS_TABS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          aria-pressed={id === selected}
          onClick={() => onSelect(id)}
          className={`rounded-lg px-3 py-1 text-sm text-fg transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${id === selected ? SELECTED : NORMAL}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
