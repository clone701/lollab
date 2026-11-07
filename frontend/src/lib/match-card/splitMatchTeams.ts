import { BLUE_TEAM_ID, RED_TEAM_ID } from '@/lib/match-detail';
import type { MatchParticipantBrief } from '@/types/summoner';

export interface MatchTeams {
  blue: MatchParticipantBrief[];
  red: MatchParticipantBrief[];
}

/** 参加者をブルー・レッドに分ける（各チーム内の並びは保つ） */
export function splitMatchTeams(
  participants: MatchParticipantBrief[]
): MatchTeams {
  return {
    blue: participants.filter((p) => p.teamId === BLUE_TEAM_ID),
    red: participants.filter((p) => p.teamId === RED_TEAM_ID),
  };
}
