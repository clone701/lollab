'use client';

import ChampionButton from '../ChampionButton';
import { champions as allChampions } from '@/lib/data/champions';

type Champion = (typeof allChampions)[number];

interface ChampionListProps {
  champions: Champion[];
  myChampionId: string | null;
  enemyChampionId: string | null;
  selectionMode: 'my' | 'enemy';
  onSelect: (id: string) => void;
}

export function ChampionList({
  champions,
  myChampionId,
  enemyChampionId,
  selectionMode,
  onSelect,
}: ChampionListProps) {
  if (champions.length === 0) {
    return (
      <div className="p-3 bg-surface-2 border border-line rounded-lg text-center">
        <p className="text-xs text-fg-muted">
          該当するチャンピオンが見つかりません
        </p>
      </div>
    );
  }
  return (
    <>
      {champions.map((champion) => (
        <ChampionButton
          key={champion.id}
          champion={champion}
          selected={
            selectionMode === 'my'
              ? myChampionId === champion.id
              : enemyChampionId === champion.id
          }
          onClick={() => onSelect(champion.id)}
        />
      ))}
    </>
  );
}
