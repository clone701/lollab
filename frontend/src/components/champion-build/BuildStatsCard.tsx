import type { BuildQuery, ChampionBuildResponse } from '@/types/championBuild';
import { BuildFilters } from './BuildFilters';
import { BuildScope } from './BuildScope';
import { RoleTabs } from './RoleTabs';
import { SummaryStats } from './SummaryStats';

interface BuildStatsCardProps {
  championId: string;
  query: BuildQuery;
  /** 読み込み中・エラーのときは null。フィルターだけを出す */
  data: ChampionBuildResponse | null;
}

// 「ビルドの集計」カード。絞り込み・ロール・概要の値をまとめる
export function BuildStatsCard({
  championId,
  query,
  data,
}: BuildStatsCardProps) {
  return (
    <section className="flex flex-col gap-3 rounded-lg border border-line-strong bg-surface p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold text-fg">ビルドの集計</h2>
        {data && (
          <BuildScope
            games={data.summary.games}
            period={data.period}
            latestPatch={data.latest_patch}
          />
        )}
      </div>
      <BuildFilters championId={championId} query={query} />
      {data && (
        <div className="flex flex-col gap-3 border-t border-line pt-3">
          <RoleTabs
            championId={championId}
            roles={data.roles}
            currentRole={data.role}
            query={query}
          />
          <SummaryStats summary={data.summary} />
        </div>
      )}
    </section>
  );
}
