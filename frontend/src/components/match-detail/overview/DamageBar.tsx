import { calcBarRatio, formatNumber } from '@/lib/match-detail';

interface DamageBarProps {
  label: string;
  value: number;
  /** 試合内の最大値。棒の長さはこれに対する割合 */
  max: number;
  /** 棒の色（役割の名前のクラス） */
  barClassName: string;
}

// ダメージの数値（上）と、試合内の最大値に対する割合の棒（下、高さ 4px）
export function DamageBar({ label, value, max, barClassName }: DamageBarProps) {
  const percent = Math.round(calcBarRatio(value, max) * 100);
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
      <span className="text-center text-xs leading-4 text-fg">
        {formatNumber(value)}
      </span>
      <div
        role="img"
        aria-label={`${label} ${formatNumber(value)}（最大の${percent}%）`}
        className="h-1 w-full overflow-hidden rounded bg-surface-2"
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
