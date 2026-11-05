'use client';

interface CharCounterProps {
  current: number;
  max: number;
}

export function CharCounter({ current, max }: CharCounterProps) {
  return (
    <span className="text-xs text-fg-muted">
      {current}/{max}
    </span>
  );
}
