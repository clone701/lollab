'use client';

import { useEffect, useState } from 'react';
import { fetchChampionData, fetchSkillValues } from '@/adapters/game-data';
import { toChampionSkills } from '@/lib/game-data';
import type { ChampionDetail } from './types';

interface LoadedDetail {
  championId: string;
  detail: ChampionDetail;
}

const EMPTY_DETAIL: ChampionDetail = { skills: null, champion: null };

/**
 * チャンピオン1体分の基礎情報とスキル（パッシブと Q/W/E/R）。
 * championId が null、読み込み前、読み込みに失敗したときは skills・champion とも null。
 * 数値入りの説明文のファイルだけ失敗したときは、概要の説明文で skills を出す
 */
export function useChampionDetail(championId: string | null): ChampionDetail {
  const [loaded, setLoaded] = useState<LoadedDetail | null>(null);

  useEffect(() => {
    if (!championId) return;
    let isCancelled = false;
    Promise.all([
      fetchChampionData(championId),
      fetchSkillValues(championId).catch(() => null),
    ])
      .then(([data, values]) => {
        if (isCancelled) return;
        const champion = Object.values(data.data)[0] ?? null;
        const skills = toChampionSkills(data, values);
        setLoaded({ championId, detail: { skills, champion } });
      })
      .catch(() => undefined);
    return () => {
      isCancelled = true;
    };
  }, [championId]);

  // チャンピオンが変わった直後に、前のチャンピオンの情報を返さない
  return loaded && loaded.championId === championId
    ? loaded.detail
    : EMPTY_DETAIL;
}
