'use client';

import { useMemo, useState } from 'react';
import { CHAMPIONS_BY_READING } from '@/lib/champion-order';
import { filterEnemies } from '@/lib/my-pick';

// 編集画面の相手の絞り込み（名前の検索・入力済みの行だけ表示）
export function useEnemyFilter(picks: Record<string, string[]>) {
  const [query, setQuery] = useState('');
  const [isFilledOnly, setIsFilledOnly] = useState(false);
  const enemies = useMemo(
    () => filterEnemies(CHAMPIONS_BY_READING, picks, query, isFilledOnly),
    [picks, query, isFilledOnly]
  );
  return { query, setQuery, isFilledOnly, setIsFilledOnly, enemies };
}
