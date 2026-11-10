'use client';
import { useId } from 'react';

interface SegmentedControlProps<T extends string> {
  /** グループの名前。showLabel が false のときは読み上げ用にだけ使う */
  label: string;
  /** true のとき、ボタンの左に label を表示する */
  showLabel?: boolean;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}

const SELECTED = 'ring-2 ring-accent bg-accent/15';
const NORMAL = 'bg-surface-2 hover:ring-2 hover:ring-accent/60';

// 横並びのボタンから1つを選ぶ（role="radiogroup"）
export function SegmentedControl<T extends string>({
  label,
  showLabel = false,
  value,
  options,
  onChange,
}: SegmentedControlProps<T>) {
  const labelId = useId();
  const group = (
    <div
      role="radiogroup"
      aria-label={showLabel ? undefined : label}
      aria-labelledby={showLabel ? labelId : undefined}
      className="flex flex-wrap gap-2"
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-lg px-3 py-1 text-sm text-fg transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${value === o.value ? SELECTED : NORMAL}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
  if (!showLabel) return group;
  return (
    <div className="flex items-center gap-2 text-sm text-fg-muted">
      <span id={labelId}>{label}</span>
      {group}
    </div>
  );
}
