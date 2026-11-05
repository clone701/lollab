'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  Region,
  SummonerDetail,
  UseSummonerDetailResult,
} from '@/types/summoner';
import { fetchSummonerDetail, updateSummoner } from '@/lib/api/summoner';
import { getErrorMessage } from '@/lib/summoner-search';

// サモナー詳細の取得と手動更新の状態を管理する
export default function useSummonerDetail(
  region: Region,
  gameName: string,
  tagLine: string
): UseSummonerDetailResult {
  const [detail, setDetail] = useState<SummonerDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const isUpdatingRef = useRef(false);
  const key = `${region}/${gameName}/${tagLine}`;
  const keyRef = useRef(key);
  const isCurrent = useCallback(() => keyRef.current === key, [key]);

  useEffect(() => {
    keyRef.current = key;
    isUpdatingRef.current = false;
    setDetail(null);
    setError(null);
    setIsUpdating(false);
    setUpdateError(null);
    setIsLoading(true);
    const load = async (): Promise<void> => {
      try {
        const d = await fetchSummonerDetail(region, gameName, tagLine);
        if (isCurrent()) setDetail(d);
      } catch (e: unknown) {
        if (isCurrent()) setError(getErrorMessage(e));
      } finally {
        if (isCurrent()) setIsLoading(false);
      }
    };
    void load();
  }, [key, isCurrent, region, gameName, tagLine]);

  const update = useCallback(async (): Promise<void> => {
    if (isUpdatingRef.current) return;
    isUpdatingRef.current = true;
    setIsUpdating(true);
    try {
      const d = await updateSummoner(region, gameName, tagLine);
      if (!isCurrent()) return;
      setDetail(d);
      setUpdateError(null);
    } catch (e: unknown) {
      if (isCurrent()) setUpdateError(getErrorMessage(e));
    } finally {
      if (isCurrent()) {
        isUpdatingRef.current = false;
        setIsUpdating(false);
      }
    }
  }, [isCurrent, region, gameName, tagLine]);

  return { detail, isLoading, error, isUpdating, updateError, update };
}
