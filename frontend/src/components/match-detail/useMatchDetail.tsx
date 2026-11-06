'use client';

import { useCallback, useContext, useEffect, useState } from 'react';
import { MATCH_DETAIL_FAILED_MESSAGE, fetchMatchDetail } from '@/adapters/api';
import type { MatchDetailResponse } from '@/types/matchDetail';
import { MatchDetailContext } from './MatchDetailContext';

export interface MatchDetailState {
  data: MatchDetailResponse | null;
  error: string | null;
  isLoading: boolean;
  retry: () => void;
}

// 試合詳細を取得する。取得済みなら Context のキャッシュを返し、読み込み直さない
export function useMatchDetail(matchId: string): MatchDetailState {
  const context = useContext(MatchDetailContext);
  if (!context) throw new Error('MatchDetailProvider の中で使ってください');
  const { cache, save } = context;
  const cached = cache[matchId] ?? null;
  const hasCached = cached !== null;
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hasCached) return;
    const controller = new AbortController();
    fetchMatchDetail(matchId, controller.signal)
      .then((detail) => save(matchId, detail))
      .catch((e: unknown) => {
        if (controller.signal.aborted) return;
        setError(e instanceof Error ? e.message : MATCH_DETAIL_FAILED_MESSAGE);
      });
    return () => controller.abort();
  }, [matchId, attempt, hasCached, save]);

  const retry = useCallback(() => {
    setError(null);
    setAttempt((n) => n + 1);
  }, []);

  return {
    data: cached,
    error: hasCached ? null : error,
    isLoading: !hasCached && error === null,
    retry,
  };
}
