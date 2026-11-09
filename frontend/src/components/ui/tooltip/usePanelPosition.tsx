'use client';

import { useLayoutEffect, useState } from 'react';
import type { RefObject } from 'react';
import { calcTooltipPosition } from '@/lib/tooltip';
import type { TooltipPosition } from '@/lib/tooltip';

/**
 * パネルの大きさを測って位置を決める。測る前は null。
 * 内容が読み込み後に変わって大きさが変わったとき、スクロール・リサイズのときも決め直す
 */
export function usePanelPosition(
  triggerRef: RefObject<HTMLElement | null>,
  panelRef: RefObject<HTMLElement | null>
): TooltipPosition | null {
  const [position, setPosition] = useState<TooltipPosition | null>(null);

  useLayoutEffect(() => {
    const trigger = triggerRef.current;
    const panel = panelRef.current;
    if (!trigger || !panel) return;
    const update = (): void => {
      const { width, height } = panel.getBoundingClientRect();
      setPosition(
        calcTooltipPosition(
          trigger.getBoundingClientRect(),
          { width, height },
          { width: window.innerWidth, height: window.innerHeight }
        )
      );
    };
    update();
    // スクロール（入れ子の領域を含む）とリサイズではトリガーの位置が動くため決め直す
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
    observer?.observe(panel);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
      observer?.disconnect();
    };
  }, [triggerRef, panelRef]);

  return position;
}
