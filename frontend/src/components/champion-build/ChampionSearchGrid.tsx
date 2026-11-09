'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { CHAMPIONS_BY_READING } from '@/lib/champion-order';
import {
  DEFAULT_PERIOD,
  DEFAULT_QUEUE,
  DEFAULT_RANK,
  buildChampionBuildHref,
  filterChampions,
} from '@/lib/champion-build';
import { ChampionGridItem } from './ChampionGridItem';

// 名前入力 + アイコン一覧。選ぶとそのチャンピオンのビルド画面へ遷移する
export function ChampionSearchGrid() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const filtered = useMemo(
    () => filterChampions(CHAMPIONS_BY_READING, query),
    [query]
  );

  const handleSelect = (championId: string): void => {
    router.push(
      buildChampionBuildHref(championId, {
        period: DEFAULT_PERIOD,
        queue: DEFAULT_QUEUE,
        rank: DEFAULT_RANK,
      })
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="チャンピオンを検索"
        placeholder="チャンピオン名（日本語・読み・英語）"
        className="w-full rounded border border-line px-3 py-2 text-sm hover:border-line-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      />
      {filtered.length === 0 ? (
        <p className="text-sm text-fg-muted">
          該当するチャンピオンがありません
        </p>
      ) : (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10">
          {filtered.map((champion) => (
            <li key={champion.id}>
              <ChampionGridItem champion={champion} onSelect={handleSelect} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
