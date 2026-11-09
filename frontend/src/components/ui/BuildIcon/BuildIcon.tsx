'use client';

import Image from 'next/image';
import { useState } from 'react';

export interface BuildIconProps {
  src: string | null;
  /** src の読み込みに失敗したときに試す URL */
  fallbackSrc?: string;
  label: string;
  size?: number;
  className?: string;
  /** ブラウザの title を付けるか。ツールチップを付けるときは false にする */
  showTitle?: boolean;
}

// 画像を読み込めない場合（未知の ID・ファイルなし）は、ラベルを title に持つ枠を出す
export function BuildIcon({
  src,
  fallbackSrc,
  label,
  size = 32,
  className = 'rounded',
  showTitle = true,
}: BuildIconProps) {
  const [failed, setFailed] = useState<string[]>([]);
  const candidates = [src, fallbackSrc].filter((s): s is string => !!s);
  const current = candidates.find((c) => !failed.includes(c));

  if (!current) {
    return (
      <span
        role="img"
        aria-label={label}
        title={showTitle ? label : undefined}
        style={{ width: size, height: size }}
        className={`inline-flex items-center justify-center bg-surface-2 text-xs text-fg-subtle ${className}`}
      >
        ?
      </span>
    );
  }
  return (
    <Image
      src={current}
      alt={label}
      title={showTitle ? label : undefined}
      width={size}
      height={size}
      unoptimized
      className={className}
      onError={() => setFailed((prev) => [...prev, current])}
    />
  );
}
