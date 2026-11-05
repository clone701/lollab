'use client';

import { useEffect, useState } from 'react';
import { GeneralNote } from '@/types/generalNote';
import { getGeneralNotes } from '@/adapters/supabase';

interface LoadedNotes {
  key: number;
  notes: GeneralNote[];
  hasError: boolean;
}

interface UseGeneralNotesReturn {
  notes: GeneralNote[];
  isLoading: boolean;
  hasError: boolean;
}

// refreshKey ごとに汎用ノートを取得する。
// 結果に取得時の key を持たせ、読み込み中かどうかはレンダー中に導出する
export function useGeneralNotes(refreshKey: number): UseGeneralNotesReturn {
  const [loaded, setLoaded] = useState<LoadedNotes | null>(null);

  useEffect(() => {
    let isStale = false;
    const finish = (notes: GeneralNote[] | null): void => {
      if (isStale) return;
      // 失敗時は直前に取得できたノートを保持する
      setLoaded((prev) => ({
        key: refreshKey,
        notes: notes ?? prev?.notes ?? [],
        hasError: notes === null,
      }));
    };
    getGeneralNotes().then(finish, () => finish(null));
    return () => {
      isStale = true;
    };
  }, [refreshKey]);

  const isReady = loaded !== null && loaded.key === refreshKey;
  return {
    notes: loaded?.notes ?? [],
    isLoading: !isReady,
    hasError: isReady && loaded.hasError,
  };
}
