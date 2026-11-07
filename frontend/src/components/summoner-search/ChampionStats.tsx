'use client';

import { useState } from 'react';
import {
  INITIAL_VISIBLE_COUNT,
  formatStatsTitle,
  getVisibleChampions,
} from '@/lib/champion-stats';
import type {
  ChampionStatsByQueue,
  ChampionStatsQueue,
} from '@/types/summoner';
import { ChampionStatRow, ChampionStatTabs } from './champion-stats';

interface ChampionStatsProps {
  stats: ChampionStatsByQueue;
  year: number | null; // 集計の範囲のランクの年。不明なら null
}

export default function ChampionStats({ stats, year }: ChampionStatsProps) {
  const [queue, setQueue] = useState<ChampionStatsQueue>('all');
  const [isExpanded, setIsExpanded] = useState(false);
  const champions = stats[queue];

  // タブを変えたら6件に戻す
  const handleSelect = (next: ChampionStatsQueue): void => {
    setQueue(next);
    setIsExpanded(false);
  };

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-base font-bold text-fg">{formatStatsTitle(year)}</h2>
      <ChampionStatTabs selected={queue} onSelect={handleSelect} />
      {champions.length === 0 ? (
        <p className="py-4 text-center text-sm text-fg-muted">
          データがありません
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-line">
          {getVisibleChampions(champions, isExpanded).map((champion) => (
            <ChampionStatRow key={champion.championName} champion={champion} />
          ))}
        </ul>
      )}
      {!isExpanded && champions.length > INITIAL_VISIBLE_COUNT && (
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="rounded-lg bg-surface-2 py-2 text-sm text-fg-muted transition-colors duration-150 hover:ring-2 hover:ring-accent/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          さらに表示
        </button>
      )}
    </section>
  );
}
