import type { ParticipantDetail } from '@/types/matchDetail';
import type { Region } from '@/types/summoner';
import { buildSearchHref } from '@/lib/summoner-search';

/** 名前のリンク先（そのプレイヤーの検索結果）。名前がない参加者は null */
export function buildParticipantSearchHref(
  p: Pick<ParticipantDetail, 'riot_id_game_name' | 'riot_id_tagline'>,
  region: Region
): string | null {
  if (!p.riot_id_game_name || !p.riot_id_tagline) return null;
  return buildSearchHref(region, `${p.riot_id_game_name}#${p.riot_id_tagline}`);
}
