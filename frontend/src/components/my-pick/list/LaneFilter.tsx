import type { PickLane } from '@/types/myPick';
import { LANE_LABELS, PICK_LANES } from '@/lib/my-pick';

interface LaneFilterProps {
  /** 選択中のレーン。null は全て */
  lane: PickLane | null;
  onChange: (lane: PickLane | null) => void;
}

const OPTIONS: { value: PickLane | null; label: string }[] = [
  { value: null, label: '全て' },
  ...PICK_LANES.map((lane) => ({ value: lane, label: LANE_LABELS[lane] })),
];

// レーンで一覧を絞り込むボタン群
export function LaneFilter({ lane, onChange }: LaneFilterProps) {
  return (
    <div
      role="group"
      aria-label="レーンで絞り込み"
      className="flex flex-wrap gap-2"
    >
      {OPTIONS.map((option) => {
        const isSelected = option.value === lane;
        return (
          <button
            key={option.label}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onChange(option.value)}
            className={`rounded px-3 py-1 text-xs font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              isSelected
                ? 'bg-accent/15 text-accent ring-2 ring-accent'
                : 'bg-surface-2 text-fg-muted hover:ring-2 hover:ring-accent/60'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
