'use client';

import { useEffect } from 'react';

// 未保存の変更があるあいだ、親へ知らせ、ページを離れる前にブラウザの確認を出す
export function useUnsavedGuard(
  isDirty: boolean,
  onDirtyChange: (isDirty: boolean) => void
): void {
  useEffect(() => {
    onDirtyChange(isDirty);
    return () => onDirtyChange(false);
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent): void => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);
}
