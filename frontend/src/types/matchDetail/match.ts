import type { ParticipantDetail } from './participant';

/** チーム1つ分の結果 */
export interface TeamDetail {
  /** 100 = ブルー、200 = レッド */
  team_id: number;
  win: boolean;
  kills: number;
  gold: number;
  /** baron, dragon, rift_herald, horde, atakhan, tower, inhibitor */
  objectives: Record<string, number>;
}

/** GET /api/match/{matchId} の応答 */
export interface MatchDetailResponse {
  match_id: string;
  queue_id: number;
  /** 秒 */
  game_duration: number;
  /** ISO 8601 */
  game_end_at: string;
  teams: TeamDetail[];
  /** チームごと・team_position の順 */
  participants: ParticipantDetail[];
}
