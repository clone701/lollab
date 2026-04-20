export type Region = 'JP' | 'KR' | 'NA' | 'EUW' | 'EUNE' | 'OCE';

export const REGION_DEFAULT_TAGS: Record<Region, string> = {
  JP: 'JP1',
  KR: 'KR1',
  NA: 'NA1',
  EUW: 'EUW',
  EUNE: 'EUNE',
  OCE: 'OCE1',
};

export interface SuggestCandidate {
  name: string;
  tagLine: string;
  region: Region;
}

export interface RankData {
  queueType: string; // 例: "ランクソロ"
  tier: string; // 例: "CHALLENGER"
  rank: string; // 例: "I"
  leaguePoints: number;
  wins: number;
  losses: number;
}

export interface SummonerData {
  name: string;
  tagLine: string;
  level: number;
  profileIconId: number;
  rank: RankData;
  previousSeasonRank: string;
}

export interface MatchData {
  matchId: string;
  isWin: boolean;
  gameMode: string;
  championName: string;
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  gameDurationSeconds: number;
  itemIds: number[];
  timeAgoSeconds: number;
}

export interface ChampionStatData {
  championName: string;
  wins: number;
  losses: number;
  cs: number;
  kda: number;
}
