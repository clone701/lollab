'use client';

import { useState, useMemo, useCallback } from 'react';
import { champions } from '@/lib/data/champions';
import useRecentChampions from '@/lib/hooks/useRecentChampions';

interface UseChampionSelectorProps {
  myChampionId: string | null;
  enemyChampionId: string | null;
  onMyChampionChange: (id: string | null) => void;
  onEnemyChampionChange: (id: string | null) => void;
  onReset?: () => void;
}

export function useChampionSelector({
  myChampionId,
  enemyChampionId,
  onMyChampionChange,
  onEnemyChampionChange,
  onReset,
}: UseChampionSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectionMode, setSelectionMode] = useState<'my' | 'enemy'>('my');
  const { recentChampions, addRecentChampion } = useRecentChampions();

  const myChampion = useMemo(
    () =>
      myChampionId
        ? (champions.find((c) => c.id === myChampionId) ?? null)
        : null,
    [myChampionId]
  );
  const enemyChampion = useMemo(
    () =>
      enemyChampionId
        ? (champions.find((c) => c.id === enemyChampionId) ?? null)
        : null,
    [enemyChampionId]
  );
  const filteredChampions = useMemo(() => {
    if (!searchQuery) return champions;
    const q = searchQuery.toLowerCase();
    return champions.filter(
      (c) => c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    []
  );

  const handleChampionSelect = useCallback(
    (championId: string) => {
      addRecentChampion(championId);
      if (selectionMode === 'my') {
        onMyChampionChange(championId);
        setSelectionMode('enemy');
      } else {
        onEnemyChampionChange(championId);
      }
      setSearchQuery('');
    },
    [
      selectionMode,
      onMyChampionChange,
      onEnemyChampionChange,
      addRecentChampion,
    ]
  );

  const handleReset = useCallback(() => {
    if (onReset) {
      onReset();
    } else {
      onMyChampionChange(null);
      onEnemyChampionChange(null);
    }
    setSelectionMode('my');
  }, [onReset, onMyChampionChange, onEnemyChampionChange]);

  return {
    searchQuery,
    selectionMode,
    recentChampions,
    myChampion,
    enemyChampion,
    filteredChampions,
    handleSearchChange,
    handleChampionSelect,
    handleReset,
    setSelectionMode,
  };
}
