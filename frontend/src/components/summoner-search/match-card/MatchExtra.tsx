import { formatCsLabel, formatKillParticipation } from '@/lib/match-card';
import { formatRank } from '@/lib/match-detail';
import type { MatchData } from '@/types/summoner';

interface MatchExtraProps {
  match: Pick<
    MatchData,
    'killParticipation' | 'cs' | 'gameDurationSeconds' | 'averageRank'
  >;
}

// 補足: キル関与率・CS（分あたり）・試合のランク（分かるときだけ）
export function MatchExtra({ match }: MatchExtraProps) {
  const { killParticipation, cs, gameDurationSeconds, averageRank } = match;
  return (
    <div className="flex flex-shrink-0 flex-col gap-0.5 whitespace-nowrap text-xs text-fg-muted">
      <p>{formatKillParticipation(killParticipation)}</p>
      <p>{formatCsLabel(cs, gameDurationSeconds)}</p>
      {averageRank && <p>{formatRank(averageRank)}</p>}
    </div>
  );
}
