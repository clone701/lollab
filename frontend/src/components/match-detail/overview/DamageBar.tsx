import { calcBarRatio, formatNumber } from '@/lib/match-detail';

interface DamageBarProps {
  label: string;
  value: number;
  /** 試合内の最大値。棒の長さはこれに対する割合 */
  max: number;
  /** 棒の色（役割の名前のクラス） */
  barClassName: string;
}

// ダメージの数値と、試合内の最大値に対する割合の棒
export function DamageBar({ label, value, max, barClassName }: DamageBarProps) {
  const percent = Math.round(calcBarRatio(value, max) * 100);
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-fg">{formatNumber(value)}</span>
      <div
        role="img"
        aria-label={`${label} ${formatNumber(value)}（最大の${percent}%）`}
        className="h-1.5 w-full overflow-hidden rounded bg-surface-2"
      >
        <div
          data-testid="damage-bar"
          className={`h-full rounded ${barClassName}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
