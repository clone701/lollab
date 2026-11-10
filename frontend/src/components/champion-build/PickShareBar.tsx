interface PickShareBarProps {
  /** 採用率（0〜1） */
  share: number;
}

// 採用率の横棒と % の数字
export function PickShareBar({ share }: PickShareBarProps) {
  const percent = Math.round(share * 100);
  return (
    <div className="flex items-center gap-2">
      <div
        role="meter"
        aria-label="採用率"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="h-1.5 w-24 overflow-hidden rounded-full bg-line"
      >
        <div
          className="h-full rounded-full bg-accent"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="w-10 text-xs text-fg-muted">{percent}%</span>
    </div>
  );
}
