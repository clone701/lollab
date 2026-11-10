import {
  calcWinRate,
  formatPercent,
  formatSignedPercent,
  rateColorClass,
} from '@/lib/champion-build';
import type { ChampionBuildSummary } from '@/types/championBuild';

interface SummaryStatsProps {
  summary: ChampionBuildSummary;
}

// 比率（0〜1）を % 表示にする。試合数が 0 のときの勝率・差は「-」にする。
// 勝率は 50% 以上、全体平均との差は 0 以上を勝ち色、それ未満を負け色にする
export function SummaryStats({ summary }: SummaryStatsProps) {
  const hasGames = summary.games > 0;
  const winRate = calcWinRate(summary.wins, summary.games);
  const items = [
    {
      term: '勝率',
      value: hasGames ? formatPercent(winRate) : '-',
      color: rateColorClass(winRate, 0.5, hasGames),
    },
    {
      term: '全体平均との差',
      value: hasGames ? formatSignedPercent(summary.win_rate_delta) : '-',
      color: rateColorClass(summary.win_rate_delta, 0, hasGames),
    },
    {
      term: 'ピック率',
      value: formatPercent(summary.pick_rate),
      color: 'text-fg',
    },
    { term: 'BAN率', value: formatPercent(summary.ban_rate), color: 'text-fg' },
    {
      term: '試合数',
      value: summary.games.toLocaleString('ja-JP'),
      color: 'text-fg',
    },
  ];
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {items.map(({ term, value, color }) => (
        <div key={term} className="rounded-lg bg-surface-2 p-3">
          <dt className="text-xs text-fg-muted">{term}</dt>
          <dd className={`text-xl font-bold ${color}`}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
