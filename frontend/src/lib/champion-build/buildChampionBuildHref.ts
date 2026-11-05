import type { BuildQuery } from '@/types/championBuild';
import { DEFAULT_PERIOD, DEFAULT_QUEUE } from './constants';

/** ビルド画面の URL を作る。既定値と同じ period・queue はクエリに含めない */
export function buildChampionBuildHref(
  championId: string,
  query: BuildQuery
): string {
  const params = new URLSearchParams();
  if (query.role) params.set('role', query.role);
  if (query.period !== DEFAULT_PERIOD) params.set('period', query.period);
  if (query.queue !== DEFAULT_QUEUE) params.set('queue', query.queue);
  const qs = params.toString();
  return `/champion/${encodeURIComponent(championId)}${qs ? `?${qs}` : ''}`;
}
