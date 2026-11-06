import type { ParticipantDetail } from '@/types/matchDetail';

interface WardCellProps {
  participant: ParticipantDetail;
}

// ワードの設置数 / 破壊数
export function WardCell({ participant: p }: WardCellProps) {
  return (
    <span className="text-sm text-fg">
      {p.wards_placed} / {p.wards_killed}
    </span>
  );
}
