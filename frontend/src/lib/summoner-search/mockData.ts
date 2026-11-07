import type {
  SummonerData,
  MatchData,
  MatchParticipantBrief,
  ChampionStatData,
  ChampionStatsByQueue,
  SuggestCandidate,
} from '@/types/summoner';

export const MOCK_SUMMONER: SummonerData = {
  puuid: 'mock-puuid',
  name: 'Hide on bush',
  tagLine: 'KR1',
  level: 487,
  profileIconId: 6,
  rank: {
    queueType: 'ランクソロ',
    tier: 'CHALLENGER',
    rank: 'I',
    leaguePoints: 1247,
    wins: 312,
    losses: 298,
  },
  lastUpdatedAt: '2025-01-01T00:00:00Z',
};

// 試合カードの参加者（ブルー puuid-1〜5、レッド puuid-6〜10。puuid-1 が検索したサモナー）
const MOCK_CHAMPIONS = [
  'Faker',
  'Orianna',
  'Syndra',
  'Ahri',
  'Zed',
  'Yasuo',
  'Lux',
  'Jinx',
  'Thresh',
  'Garen',
];

export const MOCK_PARTICIPANTS: MatchParticipantBrief[] = MOCK_CHAMPIONS.map(
  (championName, i) => ({
    puuid: `puuid-${i + 1}`,
    teamId: i < 5 ? 100 : 200,
    championName,
    riotIdGameName: `Member${i + 1}`,
    riotIdTagline: 'KR1',
  })
);

const MOCK_MATCH_BASE = {
  queueId: 420,
  killParticipation: 0.81,
  itemIds: [3157, 3089, 3135, 3165, 3040, 3020, 3363],
  spellIds: [4, 14],
  keystoneId: 8112,
  subStyleId: 8200,
  participants: MOCK_PARTICIPANTS,
  averageRank: { tier: 'DIAMOND', division: 'III' },
};

export const MOCK_MATCHES: MatchData[] = [
  {
    ...MOCK_MATCH_BASE,
    matchId: 'KR_1',
    isWin: true,
    isRemake: false,
    gameMode: 'CLASSIC',
    championName: 'Faker',
    kills: 8,
    deaths: 2,
    assists: 6,
    cs: 210,
    gameDurationSeconds: 1820,
    timeAgoSeconds: 3600,
  },
  {
    ...MOCK_MATCH_BASE,
    matchId: 'KR_2',
    isWin: false,
    isRemake: false,
    gameMode: 'CLASSIC',
    championName: 'Orianna',
    kills: 4,
    deaths: 5,
    assists: 10,
    cs: 185,
    gameDurationSeconds: 2100,
    timeAgoSeconds: 7200,
  },
  {
    ...MOCK_MATCH_BASE,
    matchId: 'KR_3',
    isWin: true,
    isRemake: false,
    gameMode: 'CLASSIC',
    championName: 'Syndra',
    kills: 12,
    deaths: 1,
    assists: 4,
    cs: 230,
    gameDurationSeconds: 1650,
    timeAgoSeconds: 14400,
  },
];

const MOCK_ALL_CHAMPION_STATS: ChampionStatData[] = [
  {
    championName: 'Ahri',
    wins: 52,
    losses: 40,
    cs: 198,
    csPerMinute: 6.9,
    kills: 6.4,
    deaths: 4.8,
    assists: 6.7,
    kda: 2.71,
  },
  {
    championName: 'Orianna',
    wins: 22,
    losses: 15,
    cs: 210,
    csPerMinute: 7.2,
    kills: 5.9,
    deaths: 3.2,
    assists: 7.2,
    kda: 4.1,
  },
  {
    championName: 'Syndra',
    wins: 18,
    losses: 12,
    cs: 205,
    csPerMinute: 7.0,
    kills: 7.8,
    deaths: 2.5,
    assists: 5.2,
    kda: 5.2,
  },
  {
    championName: 'Zed',
    wins: 14,
    losses: 16,
    cs: 190,
    csPerMinute: 6.8,
    kills: 8.1,
    deaths: 5.6,
    assists: 9.0,
    kda: 3.05,
  },
  {
    championName: 'Viktor',
    wins: 12,
    losses: 8,
    cs: 215,
    csPerMinute: 7.4,
    kills: 5.5,
    deaths: 3.1,
    assists: 6.6,
    kda: 3.9,
  },
  {
    championName: 'Azir',
    wins: 9,
    losses: 9,
    cs: 220,
    csPerMinute: 7.5,
    kills: 4.2,
    deaths: 5.0,
    assists: 7.8,
    kda: 2.4,
  },
  {
    championName: 'MonkeyKing',
    wins: 5,
    losses: 2,
    cs: 180,
    csPerMinute: 6.2,
    kills: 7.0,
    deaths: 4.0,
    assists: 11.0,
    kda: 4.5,
  },
];

export const MOCK_CHAMPION_STATS: ChampionStatsByQueue = {
  all: MOCK_ALL_CHAMPION_STATS,
  solo: MOCK_ALL_CHAMPION_STATS.slice(0, 5),
  flex: [],
};

export const MOCK_SUGGEST_CANDIDATES: SuggestCandidate[] = [
  { name: 'Hide on bush', tagLine: 'KR1', region: 'KR' },
  { name: 'Faker', tagLine: 'KR1', region: 'KR' },
  { name: 'Gumayusi', tagLine: 'KR1', region: 'KR' },
  { name: 'Keria', tagLine: 'KR1', region: 'KR' },
  { name: 'Zeus', tagLine: 'KR1', region: 'KR' },
  { name: 'Oner', tagLine: 'KR1', region: 'KR' },
  { name: 'HideOnBush', tagLine: 'JP1', region: 'JP' },
  { name: 'Caps', tagLine: 'EUW', region: 'EUW' },
  { name: 'Rekkles', tagLine: 'EUW', region: 'EUW' },
  { name: 'Doublelift', tagLine: 'NA1', region: 'NA' },
];
