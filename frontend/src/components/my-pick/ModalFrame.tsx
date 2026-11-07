'use client';

import { useEffect, type ReactNode } from 'react';

interface ModalFrameProps {
  /** 見出し要素の id（aria-labelledby に使う） */
  titleId: string;
  onClose: () => void;
  /** ダイアログの最大幅の Tailwind クラス */
  widthClass?: string;
  children: ReactNode;
}

// オーバーレイ付きのダイアログ。Esc キーとオーバーレイのクリックで閉じる
export function ModalFrame({
  titleId,
  onClose,
  widthClass = 'max-w-md',
  children,
}: ModalFrameProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        tabIndex={-1}
        aria-label="閉じる"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/60"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative w-full rounded-lg bg-surface p-4 shadow-xl ${widthClass}`}
      >
        {children}
      </div>
    </div>
  );
}
