import type {
  SummonerData,
  MatchData,
  ChampionStatData,
  Region,
  RankPositionData,
} from '@/types/summoner';

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `APIエラー: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchSummoner(
  region: Region,
  gameName: string,
  tagLine: string
): Promise<SummonerData> {
  const encoded = `${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
  return apiFetch<SummonerData>(`/api/summoner/${region}/${encoded}`);
}

export async function fetchMatches(
  region: Region,
  gameName: string,
  tagLine: string,
  count = 10
): Promise<MatchData[]> {
  const encoded = `${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
  return apiFetch<MatchData[]>(
    `/api/summoner/${region}/${encoded}/matches?count=${count}`
  );
}

export async function fetchChampionStats(
  region: Region,
  gameName: string,
  tagLine: string
): Promise<ChampionStatData[]> {
  const encoded = `${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
  return apiFetch<ChampionStatData[]>(
    `/api/summoner/${region}/${encoded}/champion-stats`
  );
}

export async function fetchRankPosition(
  region: Region,
  gameName: string,
  tagLine: string
): Promise<RankPositionData | null> {
  const encoded = `${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
  return apiFetch<RankPositionData | null>(
    `/api/summoner/${region}/${encoded}/rank-position`
  );
}
