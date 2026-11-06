import { formatKdaLine, formatKdaRatio } from '@/lib/match-detail';
import type { ParticipantDetail } from '@/types/matchDetail';

interface KdaCellProps {
  participant: ParticipantDetail;
}

// キル/デス/アシスト (キル関与率) と KDA の比率
export function KdaCell({ participant: p }: KdaCellProps) {
  const ratio = formatKdaRatio(p.kills, p.deaths, p.assists);
  return (
    <div className="flex flex-col">
      <span className="text-sm font-medium text-fg">{formatKdaLine(p)}</span>
      <span
        className={`text-xs ${ratio === 'Perfect' ? 'font-bold text-highlight' : 'text-fg-muted'}`}
      >
        {ratio}
      </span>
    </div>
  );
}
