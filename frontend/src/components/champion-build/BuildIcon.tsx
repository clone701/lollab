'use client';

import Image from 'next/image';
import { useState } from 'react';

interface BuildIconProps {
  src: string | null;
  /** src の読み込みに失敗したときに試す URL */
  fallbackSrc?: string;
  label: string;
  size?: number;
  className?: string;
}

// 画像を読み込めない場合（未知の ID・ファイルなし）は、ラベルを title に持つ枠を出す
export function BuildIcon({
  src,
  fallbackSrc,
  label,
  size = 32,
  className = 'rounded',
}: BuildIconProps) {
  const [failed, setFailed] = useState<string[]>([]);
  const candidates = [src, fallbackSrc].filter((s): s is string => !!s);
  const current = candidates.find((c) => !failed.includes(c));

  if (!current) {
    return (
      <span
        role="img"
        aria-label={label}
        title={label}
        style={{ width: size, height: size }}
        className={`inline-flex items-center justify-center bg-gray-100 text-xs text-gray-400 ${className}`}
      >
        ?
      </span>
    );
  }
  return (
    <Image
      src={current}
      alt={label}
      title={label}
      width={size}
      height={size}
      unoptimized
      className={className}
      onError={() => setFailed((prev) => [...prev, current])}
    />
  );
}
