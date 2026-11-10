import type { ChampionBuildResponse } from '@/types/championBuild';

interface BuildScopeProps {
  games: number;
  period: ChampionBuildResponse['period'];
  latestPatch: ChampionBuildResponse['latest_patch'];
}

// 集計範囲。最新パッチ指定のときだけパッチ番号を付ける（例: パッチ 16.22 ・ 191試合）
export function BuildScope({ games, period, latestPatch }: BuildScopeProps) {
  const count = `${games.toLocaleString('ja-JP')}試合`;
  const showPatch = period === 'latest_patch' && latestPatch !== null;
  return (
    <p className="text-xs text-fg-muted">
      {showPatch ? `パッチ ${latestPatch} ・ ${count}` : count}
    </p>
  );
}
