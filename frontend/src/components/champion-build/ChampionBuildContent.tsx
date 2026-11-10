'use client';
import type { Champion } from '@/types/champion';
import type { BuildQuery } from '@/types/championBuild';
import { ChampionBuildBody } from './ChampionBuildBody';
import { ChampionBuildMessage } from './ChampionBuildMessage';
import { useChampionBuild } from './useChampionBuild';

interface ChampionBuildContentProps {
  champion: Champion;
  query: BuildQuery;
}

// ビルド画面本体。データを取得し、読み込み中・エラーはカードの下に表示する
export function ChampionBuildContent({
  champion,
  query,
}: ChampionBuildContentProps) {
  const { data, error, isLoading } = useChampionBuild(champion.id, query);
  return (
    <div className="py-6">
      <ChampionBuildBody champion={champion} query={query} data={data}>
        {error ? (
          <ChampionBuildMessage text={error} />
        ) : isLoading || !data ? (
          <p className="py-8 text-center text-fg-muted">読み込み中...</p>
        ) : null}
      </ChampionBuildBody>
    </div>
  );
}
