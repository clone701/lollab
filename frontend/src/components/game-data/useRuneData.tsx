'use client';

import { fetchRuneData } from '@/adapters/game-data';
import type { DdragonRuneData } from '@/lib/game-data';
import type { GameDataState } from './types';
import { useAsyncData } from './useAsyncData';

/** ルーンの JSON。enabled が true になったときだけ読み込む */
export function useRuneData(enabled: boolean): GameDataState<DdragonRuneData> {
  return useAsyncData(fetchRuneData, enabled);
}
