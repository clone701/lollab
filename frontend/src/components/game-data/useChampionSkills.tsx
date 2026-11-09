'use client';

import { useEffect, useState } from 'react';
import { fetchChampionData } from '@/adapters/game-data';
import { toChampionSkills } from '@/lib/game-data';
import type { SkillInfo } from '@/lib/game-data';

interface LoadedSkills {
  championId: string;
  skills: SkillInfo[];
}

/**
 * チャンピオン1体分のスキル（パッシブと Q/W/E/R）。championId が null、
 * 読み込み前、読み込みに失敗したときは null
 */
export function useChampionSkills(
  championId: string | null
): SkillInfo[] | null {
  const [loaded, setLoaded] = useState<LoadedSkills | null>(null);

  useEffect(() => {
    if (!championId) return;
    let isCancelled = false;
    fetchChampionData(championId)
      .then((data) => {
        if (!isCancelled) {
          setLoaded({ championId, skills: toChampionSkills(data) });
        }
      })
      .catch(() => undefined);
    return () => {
      isCancelled = true;
    };
  }, [championId]);

  // チャンピオンが変わった直後に、前のチャンピオンのスキルを返さない
  return loaded && loaded.championId === championId ? loaded.skills : null;
}
