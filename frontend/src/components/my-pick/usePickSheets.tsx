'use client';

import { useEffect, useState } from 'react';
import { getPickSheets } from '@/adapters/supabase';
import type { PickSheet } from '@/types/myPick';

interface Loaded {
  key: number;
  sheets: PickSheet[];
  hasError: boolean;
}

interface UsePickSheetsReturn {
  sheets: PickSheet[];
  isLoading: boolean;
  hasError: boolean;
  reload: () => void;
}

// 表の一覧を取得する。reload で取り直す。
// 読み込み中かどうかは、結果に持たせた取得時の key と現在の key の比較で導出する
export function usePickSheets(): UsePickSheetsReturn {
  const [key, setKey] = useState(0);
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    let isStale = false;
    getPickSheets().then(
      (sheets) => !isStale && setLoaded({ key, sheets, hasError: false }),
      () => !isStale && setLoaded({ key, sheets: [], hasError: true })
    );
    return () => {
      isStale = true;
    };
  }, [key]);

  const isReady = loaded !== null && loaded.key === key;
  return {
    sheets: isReady ? loaded.sheets : [],
    isLoading: !isReady,
    hasError: isReady && loaded.hasError,
    reload: () => setKey((k) => k + 1),
  };
}
