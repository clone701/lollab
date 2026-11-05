import { calcWinRate, formatPercent } from '@/lib/champion-build';
import type { BuildOption } from '@/types/championBuild';

interface OptionStatProps {
  option: BuildOption;
}

// 選択肢の勝率（wins / games）と試合数。アイコンには必ず併記する
export function OptionStat({ option }: OptionStatProps) {
  const winRate = formatPercent(calcWinRate(option.wins, option.games));
  return (
    <span className="inline-flex items-baseline gap-2 whitespace-nowrap text-xs text-gray-600">
      <span className="font-semibold text-gray-800">勝率 {winRate}</span>
      <span>{option.games.toLocaleString('ja-JP')}試合</span>
    </span>
  );
}
