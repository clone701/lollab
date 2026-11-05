import {
  calcWinRate,
  formatPercent,
  formatSignedPercent,
} from '@/lib/champion-build';
import type { ChampionBuildSummary } from '@/types/championBuild';

interface SummaryStatsProps {
  summary: ChampionBuildSummary;
}

// 比率（0〜1）を % 表示にする。試合数が 0 のときは勝率・差を「-」にする
export function SummaryStats({ summary }: SummaryStatsProps) {
  const hasGames = summary.games > 0;
  const items = [
    [
      '勝率',
      hasGames ? formatPercent(calcWinRate(summary.wins, summary.games)) : '-',
    ],
    [
      '全体平均との差',
      hasGames ? formatSignedPercent(summary.win_rate_delta) : '-',
    ],
    ['ピック率', formatPercent(summary.pick_rate)],
    ['BAN率', formatPercent(summary.ban_rate)],
    ['試合数', summary.games.toLocaleString('ja-JP')],
  ];
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {items.map(([term, value]) => (
        <div key={term} className="rounded-lg bg-gray-50 p-3">
          <dt className="text-xs text-gray-600">{term}</dt>
          <dd className="text-xl font-bold text-gray-800">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
