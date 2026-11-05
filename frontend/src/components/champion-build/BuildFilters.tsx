'use client';

import { useRouter } from 'next/navigation';
import {
  PERIOD_OPTIONS,
  QUEUE_OPTIONS,
  buildChampionBuildHref,
} from '@/lib/champion-build';
import type { BuildMode, BuildQuery } from '@/types/championBuild';
import { FilterSelect } from './FilterSelect';
import { ModeToggle } from './ModeToggle';

interface BuildFiltersProps {
  championId: string;
  query: BuildQuery;
  mode: BuildMode;
  onModeChange: (mode: BuildMode) => void;
}

// 期間・キューは URL クエリを更新して切り替え、ビルド種別は画面内の状態で切り替える
export function BuildFilters({
  championId,
  query,
  mode,
  onModeChange,
}: BuildFiltersProps) {
  const router = useRouter();
  const update = (patch: Partial<BuildQuery>): void => {
    router.replace(buildChampionBuildHref(championId, { ...query, ...patch }));
  };
  return (
    <div className="flex flex-wrap items-center gap-4">
      <FilterSelect
        label="期間"
        value={query.period}
        options={PERIOD_OPTIONS}
        onChange={(period) => update({ period })}
      />
      <FilterSelect
        label="キュー"
        value={query.queue}
        options={QUEUE_OPTIONS}
        onChange={(queue) => update({ queue })}
      />
      <ModeToggle mode={mode} onChange={onModeChange} />
    </div>
  );
}
