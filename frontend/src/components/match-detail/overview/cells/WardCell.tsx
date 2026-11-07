import type { ParticipantDetail } from '@/types/matchDetail';

interface WardCellProps {
  participant: ParticipantDetail;
}

// ワード: 上にコントロールワードの購入数、下に設置数 / 破壊数。カーソルを合わせると内訳を出す
export function WardCell({ participant: p }: WardCellProps) {
  const detail = `コントロールワード購入 ${p.control_wards_bought} / ワード設置 ${p.wards_placed} / ワード破壊 ${p.wards_killed}`;
  return (
    <span
      title={detail}
      aria-label={detail}
      className="flex cursor-default flex-col items-center whitespace-nowrap leading-4"
    >
      <span className="text-xs text-fg-subtle">{p.control_wards_bought}</span>
      <span className="text-xs text-fg">
        {p.wards_placed} / {p.wards_killed}
      </span>
    </span>
  );
}
