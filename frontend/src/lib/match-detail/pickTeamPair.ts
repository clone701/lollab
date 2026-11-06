import type { TeamDetail } from '@/types/matchDetail';
import { BLUE_TEAM_ID, RED_TEAM_ID } from './teamNames';

export interface TeamPair {
  blue: TeamDetail;
  red: TeamDetail;
}

/** ブルーとレッドのチームを取り出す。どちらかがなければ null */
export function pickTeamPair(teams: TeamDetail[]): TeamPair | null {
  const blue = teams.find((t) => t.team_id === BLUE_TEAM_ID);
  const red = teams.find((t) => t.team_id === RED_TEAM_ID);
  return blue && red ? { blue, red } : null;
}
