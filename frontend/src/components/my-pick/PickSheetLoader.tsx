'use client';

import { useEffect, type ReactNode } from 'react';
import type { PickSheetDetail } from '@/types/myPick';
import { LoadError } from './LoadError';
import { LoadingSpinner } from './LoadingSpinner';
import { usePickSheet } from './usePickSheet';

interface PickSheetLoaderProps {
  sheetId: number;
  /** 表が見つからなかった（削除済みなど）とき */
  onNotFound: () => void;
  children: (sheet: PickSheetDetail) => ReactNode;
}

// 表を取得し、読み込み中・失敗・見つからないときの表示を引き受ける
export function PickSheetLoader({
  sheetId,
  onNotFound,
  children,
}: PickSheetLoaderProps) {
  const { status, sheet, retry } = usePickSheet(sheetId);

  useEffect(() => {
    if (status === 'notFound') onNotFound();
  }, [status, onNotFound]);

  if (status === 'error') return <LoadError onRetry={retry} />;
  if (status !== 'ready' || !sheet) return <LoadingSpinner />;
  return <>{children(sheet)}</>;
}
