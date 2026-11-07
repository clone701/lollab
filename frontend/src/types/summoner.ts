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

export interface RankPositionData {
  position: number;
  totalPlayers: number;
  topPercent: number;
}

export interface SummonerData {
  puuid: string;
  name: string;
  tagLine: string;
  level: number;
  profileIconId: number;
  rank: RankData;
  lastUpdatedAt: string; // ISO 8601
}

/** 試合カードの参加者の列 */
export interface MatchParticipantBrief {
  puuid: string;
  teamId: number; // 100 = ブルー、200 = レッド
  championName: string;
  riotIdGameName: string | null;
  riotIdTagline: string | null;
}

/** 試合のランク（分かる参加者の平均）。マスター以上は division が null */
export interface MatchRankBrief {
  tier: string; // 例: "EMERALD"
  division: string | null;
}

export interface MatchData {
  matchId: string;
  isWin: boolean;
  /** リメイク（早期降伏）の試合。カードを灰色にし、勝敗の代わりに「リメイク」と出す */
  isRemake: boolean;
  gameMode: string;
  queueId: number; // 420 = ソロ/デュオ、440 = フレックス
  championName: string;
  kills: number;
  deaths: number;
  assists: number;
  killParticipation: number; // 0〜1
  cs: number;
  gameDurationSeconds: number;
  itemIds: number[]; // item0〜6（0 は空き）
  spellIds: number[]; // [spell1, spell2]
  keystoneId: number;
  subStyleId: number;
  participants: MatchParticipantBrief[]; // 10人。チーム、ポジションの順
  averageRank: MatchRankBrief | null;
  timeAgoSeconds: number;
}

export interface ChampionStatData {
  championName: string;
  wins: number;
  losses: number;
  cs: number; // 1試合あたりの平均 CS
  csPerMinute: number; // 分あたりの平均 CS
  kills: number; // 1試合あたりの平均キル
  deaths: number; // 1試合あたりの平均デス
  assists: number; // 1試合あたりの平均アシスト
  kda: number;
}

/** キューごとのチャンピオン統計（各リストは試合数の降順） */
export interface ChampionStatsByQueue {
  all: ChampionStatData[]; // ソロ(420)とフレックス(440)の両方
  solo: ChampionStatData[]; // 420
  flex: ChampionStatData[]; // 440
}

export type ChampionStatsQueue = keyof ChampionStatsByQueue;

export interface SummonerDetail {
  summoner: SummonerData;
  rankPosition: RankPositionData | null;
  matches: MatchData[];
  championStats: ChampionStatsByQueue;
  championStatsYear: number | null; // 集計の範囲のランクの年。不明なら null
}

export interface UseSummonerDetailResult {
  detail: SummonerDetail | null;
  isLoading: boolean;
  error: string | null;
  isUpdating: boolean;
  updateError: string | null;
  update: () => Promise<void>;
}
