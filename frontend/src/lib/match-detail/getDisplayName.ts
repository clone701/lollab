import type { ParticipantDetail } from '@/types/matchDetail';

/** 表示用の名前。Riot ID の名前がない参加者は「名前なし」 */
export function getDisplayName(
  p: Pick<ParticipantDetail, 'riot_id_game_name'>
): string {
  return p.riot_id_game_name || '名前なし';
}
