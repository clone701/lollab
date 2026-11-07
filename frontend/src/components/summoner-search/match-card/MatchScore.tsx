import { formatKdaLabel } from '@/lib/match-card';
import type { MatchData } from '@/types/summoner';

interface MatchScoreProps {
  match: Pick<MatchData, 'kills' | 'deaths' | 'assists'>;
}

// 成績: KDA（デスは敗北色）と KDA の比率
export function MatchScore({ match }: MatchScoreProps) {
  const { kills, deaths, assists } = match;
  const label = formatKdaLabel(kills, deaths, assists);
  return (
    <div className="flex w-20 flex-shrink-0 flex-col items-center gap-0.5">
      <p className="text-base font-bold text-fg">
        {kills} / <span className="text-loss">{deaths}</span> / {assists}
      </p>
      <p
        className={`text-xs ${label === 'Perfect' ? 'font-bold text-highlight' : 'text-fg-muted'}`}
      >
        {label}
      </p>
    </div>
  );
}
