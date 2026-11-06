'use client';

import { useEffect, useState } from 'react';
import { fetchChampionBuild } from '@/adapters/api';
import { toRiotChampionName } from '@/lib/champion-build';
import type { BuildQuery, ChampionBuildResponse } from '@/types/championBuild';

interface ChampionBuildState {
  data: ChampionBuildResponse | null;
  error: string | null;
  isLoading: boolean;
}

interface Result {
  key: string;
  data: ChampionBuildResponse | null;
  error: string | null;
}

// championId・role・period・queue・rank が変わるたびに取得し直す
export function useChampionBuild(
  championId: string,
  query: BuildQuery
): ChampionBuildState {
  const { role, period, queue, rank } = query;
  const key = `${championId}|${role ?? ''}|${period}|${queue}|${rank}`;
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchChampionBuild(
      toRiotChampionName(championId),
      { role, period, queue, rank },
      controller.signal
    )
      .then((data) => setResult({ key, data, error: null }))
      .catch((e: unknown) => {
        if (controller.signal.aborted) return;
        const error = e instanceof Error ? e.message : '取得に失敗しました';
        setResult({ key, data: null, error });
      });
    return () => controller.abort();
  }, [key, championId, role, period, queue, rank]);

  // 取得結果が現在の条件のものでなければ読み込み中として扱う
  const isCurrent = result?.key === key;
  return {
    data: isCurrent ? result.data : null,
    error: isCurrent ? result.error : null,
    isLoading: !isCurrent,
  };
}
