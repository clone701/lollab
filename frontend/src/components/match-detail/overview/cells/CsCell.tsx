import { formatCsPerMinute } from '@/lib/match-detail';
import type { ParticipantDetail } from '@/types/matchDetail';

interface CsCellProps {
  participant: ParticipantDetail;
  /** 試合時間（秒） */
  durationSeconds: number;
}

// CS（上）と分あたりの CS（下）
export function CsCell({ participant: p, durationSeconds }: CsCellProps) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-sm leading-4 text-fg">{p.cs}</span>
      <span className="text-xs leading-4 text-fg-muted">
        {formatCsPerMinute(p.cs, durationSeconds)}/分
      </span>
    </div>
  );
}
