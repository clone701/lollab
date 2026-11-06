'use client';

import { createContext, useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { MatchDetailResponse } from '@/types/matchDetail';

export interface MatchDetailCache {
  /** matchId → 取得済みの試合詳細 */
  cache: Record<string, MatchDetailResponse>;
  save: (matchId: string, detail: MatchDetailResponse) => void;
}

export const MatchDetailContext = createContext<MatchDetailCache | null>(null);

// 取得済みの試合詳細を持つ。閉じて開き直しても読み込み直さないため、検索結果の画面が持つ
export function MatchDetailProvider({ children }: { children: ReactNode }) {
  const [cache, setCache] = useState<Record<string, MatchDetailResponse>>({});
  const save = useCallback((matchId: string, detail: MatchDetailResponse) => {
    setCache((prev) => ({ ...prev, [matchId]: detail }));
  }, []);
  const value = useMemo(() => ({ cache, save }), [cache, save]);
  return (
    <MatchDetailContext.Provider value={value}>
      {children}
    </MatchDetailContext.Provider>
  );
}
