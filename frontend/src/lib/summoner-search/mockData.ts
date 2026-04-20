import type {
  SummonerData,
  MatchData,
  ChampionStatData,
  SuggestCandidate,
} from '@/types/summoner';

export const MOCK_SUMMONER: SummonerData = {
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
  previousSeasonRank: 'GRANDMASTER I',
};

export const MOCK_MATCHES: MatchData[] = [
  {
    matchId: 'KR_1',
    isWin: true,
    gameMode: 'ランク',
    championName: 'Faker',
    kills: 8,
    deaths: 2,
    assists: 6,
    cs: 210,
    gameDurationSeconds: 1820,
    itemIds: [3157, 3089, 3135, 3165, 3040, 3020],
    timeAgoSeconds: 3600,
  },
  {
    matchId: 'KR_2',
    isWin: false,
    gameMode: 'ランク',
    championName: 'Orianna',
    kills: 4,
    deaths: 5,
    assists: 10,
    cs: 185,
    gameDurationSeconds: 2100,
    itemIds: [3157, 3089, 3135, 3165, 3040, 3020],
    timeAgoSeconds: 7200,
  },
  {
    matchId: 'KR_3',
    isWin: true,
    gameMode: 'ランク',
    championName: 'Syndra',
    kills: 12,
    deaths: 1,
    assists: 4,
    cs: 230,
    gameDurationSeconds: 1650,
    itemIds: [3157, 3089, 3135, 3165, 3040, 3020],
    timeAgoSeconds: 14400,
  },
];

export const MOCK_CHAMPION_STATS: ChampionStatData[] = [
  {
    championName: 'Faker',
    wins: 29,
    losses: 18,
    cs: 47,
    kda: 3.6,
  },
  {
    championName: 'Orianna',
    wins: 22,
    losses: 15,
    cs: 42,
    kda: 4.1,
  },
  {
    championName: 'Syndra',
    wins: 18,
    losses: 12,
    cs: 51,
    kda: 5.2,
  },
];

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
