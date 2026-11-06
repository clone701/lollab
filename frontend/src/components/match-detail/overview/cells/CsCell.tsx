import { formatCsPerMinute } from '@/lib/match-detail';
import type { ParticipantDetail } from '@/types/matchDetail';

interface CsCellProps {
  participant: ParticipantDetail;
  /** 試合時間（秒） */
  durationSeconds: number;
}

// CS と分あたりの CS
export function CsCell({ participant: p, durationSeconds }: CsCellProps) {
  return (
    <div className="flex flex-col">
      <span className="text-sm text-fg">{p.cs}</span>
      <span className="text-xs text-fg-muted">
        {formatCsPerMinute(p.cs, durationSeconds)}/分
      </span>
    </div>
  );
}
