'use client';

import { fetchItemData } from '@/adapters/game-data';
import type { DdragonItemData } from '@/lib/game-data';
import type { GameDataState } from './types';
import { useAsyncData } from './useAsyncData';

/** アイテムの JSON。enabled が true になったときだけ読み込む */
export function useItemData(enabled: boolean): GameDataState<DdragonItemData> {
  return useAsyncData(fetchItemData, enabled);
}
