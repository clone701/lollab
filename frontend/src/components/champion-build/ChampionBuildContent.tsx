'use client';

import { useState } from 'react';
import type { Champion } from '@/types/champion';
import type { BuildMode, BuildQuery } from '@/types/championBuild';
import { BuildFilters } from './BuildFilters';
import { ChampionBuildBody } from './ChampionBuildBody';
import { ChampionBuildMessage } from './ChampionBuildMessage';
import { useChampionBuild } from './useChampionBuild';

interface ChampionBuildContentProps {
  champion: Champion;
  query: BuildQuery;
}

// ビルド画面本体。データ取得と「最高勝率 / 最多」の切り替え状態を持つ
export function ChampionBuildContent({
  champion,
  query,
}: ChampionBuildContentProps) {
  const [mode, setMode] = useState<BuildMode>('best_win_rate');
  const { data, error, isLoading } = useChampionBuild(champion.id, query);

  return (
    <div className="flex flex-col gap-4 py-6">
      <BuildFilters
        championId={champion.id}
        query={query}
        mode={mode}
        onModeChange={setMode}
      />
      {error ? (
        <ChampionBuildMessage text={error} />
      ) : isLoading || !data ? (
        <p className="py-8 text-center text-gray-500">読み込み中...</p>
      ) : (
        <ChampionBuildBody
          champion={champion}
          query={query}
          data={data}
          mode={mode}
        />
      )}
    </div>
  );
}
