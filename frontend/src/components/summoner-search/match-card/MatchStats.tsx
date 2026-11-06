import type { MatchData } from '@/types/summoner';
import { formatDuration } from '@/lib/summoner-search';

interface MatchStatsProps {
  match: MatchData;
}

// 中央情報: ゲームモード・KDA・CS と試合時間
export function MatchStats({ match }: MatchStatsProps) {
  const { gameMode, kills, deaths, assists, cs, gameDurationSeconds } = match;
  const kda =
    deaths === 0 ? 'Perfect' : ((kills + assists) / deaths).toFixed(2) + ' KDA';
  return (
    <div className="flex-1 min-w-0 space-y-0.5">
      <p className="text-xs text-fg-muted">{gameMode}</p>
      <p className="text-xs font-medium text-fg">
        {kills}/{deaths}/{assists} — {kda}
      </p>
      <p className="text-xs text-fg-muted">
        CS {cs} ({(cs / (gameDurationSeconds / 60)).toFixed(1)}) ·{' '}
        {formatDuration(gameDurationSeconds)}
      </p>
    </div>
  );
}
