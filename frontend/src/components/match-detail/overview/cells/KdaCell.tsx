import { formatKdaLine, formatKdaRatio } from '@/lib/match-detail';
import type { ParticipantDetail } from '@/types/matchDetail';

interface KdaCellProps {
  participant: ParticipantDetail;
}

// キル/デス/アシスト (キル関与率)（上）と KDA の比率（下）。中央揃え
export function KdaCell({ participant: p }: KdaCellProps) {
  const ratio = formatKdaRatio(p.kills, p.deaths, p.assists);
  return (
    <div className="flex flex-col items-center whitespace-nowrap">
      <span className="text-sm font-medium leading-4 text-fg">
        {formatKdaLine(p)}
      </span>
      <span
        className={`text-xs leading-4 ${ratio === 'Perfect' ? 'font-bold text-highlight' : 'text-fg-muted'}`}
      >
        {ratio}
      </span>
    </div>
  );
}
