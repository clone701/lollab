import { calcShare, formatNumber } from '@/lib/match-detail';

interface ComparisonBarProps {
  label: string;
  blue: number;
  red: number;
}

// ブルーとレッドの値を、左右の長さで比べる棒
export function ComparisonBar({ label, blue, red }: ComparisonBarProps) {
  const bluePercent = Math.round(calcShare(blue, red) * 100);
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center justify-between text-xs leading-4">
        <span className="font-medium text-accent">{formatNumber(blue)}</span>
        <span className="text-fg-muted">{label}</span>
        <span className="font-medium text-danger-fg">{formatNumber(red)}</span>
      </div>
      <div
        role="img"
        aria-label={`${label} ブルー ${formatNumber(blue)} 対 レッド ${formatNumber(red)}`}
        className="flex h-1.5 overflow-hidden rounded bg-danger"
      >
        <div
          data-testid="comparison-blue"
          className="h-full bg-action"
          style={{ width: `${bluePercent}%` }}
        />
      </div>
    </div>
  );
}
