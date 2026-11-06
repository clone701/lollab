import type { Region, SummonerDetail } from '@/types/summoner';
import { apiFetch } from './request';

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await apiFetch(path, init);
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
  return fetchJson<SummonerDetail>(
    buildSummonerPath(region, gameName, tagLine)
  );
}

export async function updateSummoner(
  region: Region,
  gameName: string,
  tagLine: string
): Promise<SummonerDetail> {
  return fetchJson<SummonerDetail>(
    `${buildSummonerPath(region, gameName, tagLine)}/update`,
    { method: 'POST' }
  );
}
