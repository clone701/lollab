import type {
  MatchDetailResponse,
  ParticipantDetail,
  TeamDetail,
} from '@/types/matchDetail';

export interface TeamGroup {
  team: TeamDetail;
  participants: ParticipantDetail[];
}

/** チームごとに参加者を分ける。勝利チームを先頭にする（同じなら team_id の順） */
export function splitTeams(
  match: Pick<MatchDetailResponse, 'teams' | 'participants'>
): TeamGroup[] {
  return [...match.teams]
    .sort((a, b) => Number(b.win) - Number(a.win) || a.team_id - b.team_id)
    .map((team) => ({
      team,
      participants: match.participants.filter(
        (p) => p.team_id === team.team_id
      ),
    }));
}
