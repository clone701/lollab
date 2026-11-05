import type { ChampionBuildResponse } from '@/types/championBuild';

interface BuildScopeProps {
  games: number;
  period: ChampionBuildResponse['period'];
  latestPatch: ChampionBuildResponse['latest_patch'];
}

// 集計対象の試合数と、最新パッチ指定のときのパッチ番号
export function BuildScope({ games, period, latestPatch }: BuildScopeProps) {
  const showPatch = period === 'latest_patch' && latestPatch !== null;
  return (
    <p className="text-sm text-fg-muted">
      集計対象: {games.toLocaleString('ja-JP')}試合
      {showPatch && <span className="ml-2">パッチ {latestPatch}</span>}
    </p>
  );
}
