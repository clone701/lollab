'use client';

import { fetchSummonerData } from '@/adapters/game-data';
import type { DdragonSummonerData } from '@/lib/game-data';
import type { GameDataState } from './types';
import { useAsyncData } from './useAsyncData';

/** サモナースペルの JSON。enabled が true になったときだけ読み込む */
export function useSummonerData(
  enabled: boolean
): GameDataState<DdragonSummonerData> {
  return useAsyncData(fetchSummonerData, enabled);
}
