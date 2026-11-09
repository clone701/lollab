import { pickTeamPair } from '@/lib/match-detail';
import type { TeamDetail } from '@/types/matchDetail';
import { ComparisonBar } from './ComparisonBar';
import { ObjectiveList } from './ObjectiveList';

interface TeamComparisonProps {
  teams: TeamDetail[];
}

// 両チームの合計キル・合計ゴールドの比較と、オブジェクトの獲得数
export function TeamComparison({ teams }: TeamComparisonProps) {
  const pair = pickTeamPair(teams);
  if (!pair) return null;
  const { blue, red } = pair;
  return (
    <section
      aria-label="チームの比較"
      className="flex flex-col gap-1.5 rounded-lg bg-surface-2 px-3 py-2"
    >
      <div className="flex justify-between text-xs font-semibold">
        <span className="text-team-blue">ブルー</span>
        <span className="text-team-red">レッド</span>
      </div>
      <ComparisonBar label="合計キル" blue={blue.kills} red={red.kills} />
      <ComparisonBar label="合計ゴールド" blue={blue.gold} red={red.gold} />
      <ObjectiveList pair={pair} />
    </section>
  );
}
