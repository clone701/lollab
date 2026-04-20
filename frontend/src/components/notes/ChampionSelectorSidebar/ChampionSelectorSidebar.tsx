'use client';

import React from 'react';
import { useChampionSelector } from './useChampionSelector';
import { ChampionSelectorSidebarView } from './ChampionSelectorSidebarView';

interface ChampionSelectorSidebarProps {
  myChampionId: string | null;
  enemyChampionId: string | null;
  onMyChampionChange: (id: string | null) => void;
  onEnemyChampionChange: (id: string | null) => void;
  onReset?: () => void;
}

const ChampionSelectorSidebar = React.memo(function ChampionSelectorSidebar({
  myChampionId,
  enemyChampionId,
  onMyChampionChange,
  onEnemyChampionChange,
  onReset,
}: ChampionSelectorSidebarProps) {
  const state = useChampionSelector({
    myChampionId,
    enemyChampionId,
    onMyChampionChange,
    onEnemyChampionChange,
    onReset,
  });
  return (
    <ChampionSelectorSidebarView
      myChampionId={myChampionId}
      enemyChampionId={enemyChampionId}
      onMyChampionChange={onMyChampionChange}
      onEnemyChampionChange={onEnemyChampionChange}
      {...state}
    />
  );
});

export default ChampionSelectorSidebar;
