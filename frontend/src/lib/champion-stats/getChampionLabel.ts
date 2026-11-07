import { getChampionById } from '@/lib/data/champions';
import { toChampionId } from '@/lib/match-detail';

/** チャンピオンの日本語名。見つからなければ championName をそのまま返す */
export function getChampionLabel(championName: string): string {
  return getChampionById(toChampionId(championName))?.name ?? championName;
}
