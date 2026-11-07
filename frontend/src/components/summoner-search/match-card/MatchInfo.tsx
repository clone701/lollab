import { getQueueName, getResultClass, getResultLabel } from '@/lib/match-card';
import { formatDuration, formatTimeAgo } from '@/lib/summoner-search';
import type { MatchData } from '@/types/summoner';

interface MatchInfoProps {
  match: Pick<
    MatchData,
    | 'queueId'
    | 'gameMode'
    | 'timeAgoSeconds'
    | 'isWin'
    | 'isRemake'
    | 'gameDurationSeconds'
  >;
}

// 左の列: キューの種類・経過時間・勝敗（リメイクは「リメイク」）・試合時間
export function MatchInfo({ match }: MatchInfoProps) {
  const { queueId, gameMode, timeAgoSeconds, isWin, isRemake } = match;
  const { gameDurationSeconds } = match;
  return (
    <div className="flex flex-shrink-0 flex-col gap-0.5 whitespace-nowrap">
      <p className="text-xs font-semibold text-fg">
        {getQueueName(queueId, gameMode)}
      </p>
      <p className="text-xs text-fg-subtle">{formatTimeAgo(timeAgoSeconds)}</p>
      <p className={`text-sm font-bold ${getResultClass(isWin, isRemake)}`}>
        {getResultLabel(isWin, isRemake)}
      </p>
      <p className="text-xs text-fg-muted">
        {formatDuration(gameDurationSeconds)}
      </p>
    </div>
  );
}
