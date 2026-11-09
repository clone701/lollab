import { toDdragonChampionKey } from '@/lib/game-data';
import type { SkillValues } from '@/lib/game-data';
import { SKILL_VALUES_BASE_PATH } from './constants';
import { loadOnce } from './loadOnce';

/**
 * チャンピオン1体分の数値入りのスキル説明文を取得する。
 * championId は champions.ts の id。ファイルが無い（404）ときは null
 */
export function fetchSkillValues(
  championId: string
): Promise<SkillValues | null> {
  const key = encodeURIComponent(toDdragonChampionKey(championId));
  return loadOnce<SkillValues>(`${SKILL_VALUES_BASE_PATH}/${key}.json`).catch(
    (e: unknown) => {
      if ((e as { status?: number }).status === 404) return null;
      throw e;
    }
  );
}
