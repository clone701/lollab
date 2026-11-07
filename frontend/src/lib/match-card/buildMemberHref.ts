import { buildParticipantSearchHref } from '@/lib/match-detail';
import type { MatchParticipantBrief, Region } from '@/types/summoner';

/** 参加者の名前のリンク先（そのプレイヤーの検索結果）。名前がなければ null */
export function buildMemberHref(
  p: Pick<MatchParticipantBrief, 'riotIdGameName' | 'riotIdTagline'>,
  region: Region
): string | null {
  return buildParticipantSearchHref(
    { riot_id_game_name: p.riotIdGameName, riot_id_tagline: p.riotIdTagline },
    region
  );
}
