'use client';

interface CharCounterProps {
  current: number;
  max: number;
}

export function CharCounter({ current, max }: CharCounterProps) {
  return (
    <span className="text-xs text-gray-600">
      {current}/{max}
    </span>
  );
}
