'use client';

import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import type { Region, UseSummonerDetailResult } from '@/types/summoner';
import { fetchSummonerDetail, updateSummoner } from '@/lib/api/summoner';
import { getErrorMessage } from '@/lib/summoner-search';
import {
  INITIAL_SUMMONER_DETAIL_STATE,
  mergeSummonerDetailState,
} from './summonerDetailState';

// サモナー詳細の取得と手動更新の状態を管理する
export default function useSummonerDetail(
  region: Region,
  gameName: string,
  tagLine: string
): UseSummonerDetailResult {
  const [state, patch] = useReducer(
    mergeSummonerDetailState,
    INITIAL_SUMMONER_DETAIL_STATE
  );
  const isUpdatingRef = useRef(false);
  const key = `${region}/${gameName}/${tagLine}`;
  const keyRef = useRef(key);
  const isCurrent = useCallback(() => keyRef.current === key, [key]);

  // 取得対象が変わったら、前回の結果を捨てて取得前の状態に戻す（レンダー中に前回値と比較）
  const [prevKey, setPrevKey] = useState(key);
  if (prevKey !== key) {
    setPrevKey(key);
    patch(INITIAL_SUMMONER_DETAIL_STATE);
  }

  useEffect(() => {
    keyRef.current = key;
    isUpdatingRef.current = false;
    const load = async (): Promise<void> => {
      try {
        const d = await fetchSummonerDetail(region, gameName, tagLine);
        if (isCurrent()) patch({ detail: d });
      } catch (e: unknown) {
        if (isCurrent()) patch({ error: getErrorMessage(e) });
      } finally {
        if (isCurrent()) patch({ isLoading: false });
      }
    };
    void load();
  }, [key, isCurrent, region, gameName, tagLine]);

  const update = useCallback(async (): Promise<void> => {
    if (isUpdatingRef.current) return;
    isUpdatingRef.current = true;
    patch({ isUpdating: true });
    try {
      const d = await updateSummoner(region, gameName, tagLine);
      if (!isCurrent()) return;
      patch({ detail: d, updateError: null });
    } catch (e: unknown) {
      if (isCurrent()) patch({ updateError: getErrorMessage(e) });
    } finally {
      if (isCurrent()) {
        isUpdatingRef.current = false;
        patch({ isUpdating: false });
      }
    }
  }, [isCurrent, region, gameName, tagLine]);

  return { ...state, update };
}
