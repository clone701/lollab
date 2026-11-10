'use client';
import { useRouter } from 'next/navigation';
import {
  PERIOD_OPTIONS,
  QUEUE_OPTIONS,
  RANK_OPTIONS,
  buildChampionBuildHref,
} from '@/lib/champion-build';
import type { BuildQuery } from '@/types/championBuild';
import { FilterSelect } from './FilterSelect';
import { SegmentedControl } from './SegmentedControl';

interface BuildFiltersProps {
  championId: string;
  query: BuildQuery;
}

// 期間・キュー・ランク帯は URL クエリを更新して切り替える
export function BuildFilters({ championId, query }: BuildFiltersProps) {
  const router = useRouter();
  const update = (patch: Partial<BuildQuery>): void => {
    router.replace(buildChampionBuildHref(championId, { ...query, ...patch }));
  };
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
      <SegmentedControl
        label="期間"
        showLabel
        value={query.period}
        options={PERIOD_OPTIONS}
        onChange={(period) => update({ period })}
      />
      <SegmentedControl
        label="キュー"
        showLabel
        value={query.queue}
        options={QUEUE_OPTIONS}
        onChange={(queue) => update({ queue })}
      />
      <FilterSelect
        label="ランク帯"
        value={query.rank}
        options={RANK_OPTIONS}
        onChange={(rank) => update({ rank })}
      />
    </div>
  );
}
