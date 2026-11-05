import type { BuildQuery, ChampionBuildResponse } from '@/types/championBuild';
import { toChampionBuildErrorMessage } from './championBuildError';

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';

function buildUrl(championName: string, query: BuildQuery): string {
  const params = new URLSearchParams({
    period: query.period,
    queue: query.queue,
  });
  if (query.role) params.set('role', query.role);
  const name = encodeURIComponent(championName);
  return `${BASE_URL}/api/champion/${name}/build?${params.toString()}`;
}

/** チャンピオンのビルド集計を取得する。失敗時は画面表示用のメッセージで throw する */
export async function fetchChampionBuild(
  championName: string,
  query: BuildQuery,
  signal?: AbortSignal
): Promise<ChampionBuildResponse> {
  let res: Response;
  try {
    res = await fetch(buildUrl(championName, query), { signal });
  } catch (e: unknown) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e;
    throw new Error('サーバーに接続できませんでした');
  }
  if (!res.ok) {
    const body: unknown = await res.json().catch(() => null);
    throw new Error(toChampionBuildErrorMessage(res.status, body));
  }
  return (await res.json()) as ChampionBuildResponse;
}
