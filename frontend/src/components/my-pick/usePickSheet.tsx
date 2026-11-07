'use client';

import { useEffect, useState } from 'react';
import { getPickSheet } from '@/adapters/supabase';
import type { PickSheetDetail } from '@/types/myPick';

type Status = 'loading' | 'ready' | 'notFound' | 'error';

interface Loaded {
  key: string;
  status: Exclude<Status, 'loading'>;
  sheet: PickSheetDetail | null;
}

interface UsePickSheetReturn {
  status: Status;
  sheet: PickSheetDetail | null;
  retry: () => void;
}

// 表1枚（ピック付き）を取得する。表を切り替えた・再試行したときに取り直す。
// 読み込み中かどうかは、結果に持たせた取得時の key と現在の key の比較で導出する
export function usePickSheet(sheetId: number): UsePickSheetReturn {
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const key = `${sheetId}:${attempt}`;

  useEffect(() => {
    let isStale = false;
    const finish = (
      status: Loaded['status'],
      sheet: PickSheetDetail | null
    ) => {
      if (!isStale) setLoaded({ key, status, sheet });
    };
    getPickSheet(sheetId).then(
      (sheet) => finish(sheet ? 'ready' : 'notFound', sheet),
      () => finish('error', null)
    );
    return () => {
      isStale = true;
    };
  }, [sheetId, key]);

  const isReady = loaded !== null && loaded.key === key;
  return {
    status: isReady ? loaded.status : 'loading',
    sheet: isReady ? loaded.sheet : null,
    retry: () => setAttempt((a) => a + 1),
  };
}
