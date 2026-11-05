import type { Region, SummonerDetail } from '@/types/summoner';

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `APIエラー: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

function buildSummonerPath(
  region: Region,
  gameName: string,
  tagLine: string
): string {
  const encoded = `${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
  return `/api/summoner/${region}/${encoded}`;
}

export async function fetchSummonerDetail(
  region: Region,
  gameName: string,
  tagLine: string
): Promise<SummonerDetail> {
  return apiFetch<SummonerDetail>(buildSummonerPath(region, gameName, tagLine));
}

export async function updateSummoner(
  region: Region,
  gameName: string,
  tagLine: string
): Promise<SummonerDetail> {
  return apiFetch<SummonerDetail>(
    `${buildSummonerPath(region, gameName, tagLine)}/update`,
    { method: 'POST' }
  );
}
