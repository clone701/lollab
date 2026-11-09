'use client';

import { useEffect, useState } from 'react';
import type { GameDataState } from './types';

/** enabled が true になったときだけ load を呼び、読み込み中・失敗・成功の状態を返す */
export function useAsyncData<T>(
  load: () => Promise<T>,
  enabled: boolean
): GameDataState<T> {
  const [state, setState] = useState<GameDataState<T>>({ status: 'loading' });

  useEffect(() => {
    if (!enabled) return;
    let isCancelled = false;
    load()
      .then((data) => {
        if (!isCancelled) setState({ status: 'data', data });
      })
      .catch(() => {
        if (!isCancelled) setState({ status: 'error' });
      });
    return () => {
      isCancelled = true;
    };
  }, [load, enabled]);

  return state;
}
