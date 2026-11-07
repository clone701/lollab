import { getDisplayName } from '@/lib/match-detail';
import type { MatchParticipantBrief } from '@/types/summoner';

/** 参加者の表示名（名前がなければ「名前なし」）と、title に出す全名（名前#タグ） */
export function getMemberName(
  p: Pick<MatchParticipantBrief, 'riotIdGameName' | 'riotIdTagline'>
): { name: string; fullName: string } {
  const name = getDisplayName({ riot_id_game_name: p.riotIdGameName });
  const fullName = p.riotIdTagline ? `${name}#${p.riotIdTagline}` : name;
  return { name, fullName };
}
