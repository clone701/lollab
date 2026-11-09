'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/** マウスが乗ってから開くまでの遅れ（ms）。通り過ぎただけで出ないようにする */
const TOOLTIP_OPEN_DELAY_MS = 100;

interface TooltipHandlers {
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onFocus: () => void;
  onBlur: () => void;
}

/**
 * ツールチップの開閉の状態。mouseenter は遅れて、focus は即時に開く。
 * mouseleave・blur・Esc で閉じる
 */
export function useTooltip(): { isOpen: boolean; handlers: TooltipHandlers } {
  const [isOpen, setIsOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback((): void => {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);
  const open = useCallback((): void => {
    clearTimer();
    setIsOpen(true);
  }, [clearTimer]);
  const close = useCallback((): void => {
    clearTimer();
    setIsOpen(false);
  }, [clearTimer]);
  const openLater = useCallback((): void => {
    clearTimer();
    timerRef.current = setTimeout(open, TOOLTIP_OPEN_DELAY_MS);
  }, [clearTimer, open]);

  useEffect(() => clearTimer, [clearTimer]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, close]);

  return {
    isOpen,
    handlers: {
      onMouseEnter: openLater,
      onMouseLeave: close,
      onFocus: open,
      onBlur: close,
    },
  };
}
