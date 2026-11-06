'use client';

import { useSearchParams } from 'next/navigation';
import { parseBuildQuery } from '@/lib/champion-build';
import type { Champion } from '@/types/champion';
import { ChampionBuildContent } from './ChampionBuildContent';

interface ChampionBuildFromUrlProps {
  champion: Champion;
}

// 静的書き出しではページがサーバーでクエリを読めないため、ブラウザで URL のクエリを読む
export function ChampionBuildFromUrl({ champion }: ChampionBuildFromUrlProps) {
  const searchParams = useSearchParams();
  const query = parseBuildQuery({
    role: searchParams.get('role') ?? undefined,
    period: searchParams.get('period') ?? undefined,
    queue: searchParams.get('queue') ?? undefined,
  });
  return <ChampionBuildContent champion={champion} query={query} />;
}
