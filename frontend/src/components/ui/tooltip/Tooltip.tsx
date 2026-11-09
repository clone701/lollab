'use client';

import { useId, useRef } from 'react';
import type { ReactNode } from 'react';
import { TooltipPanel } from './TooltipPanel';
import { useTooltip } from './useTooltip';

interface TooltipProps {
  /** ツールチップを出す対象（アイコンなど） */
  trigger: ReactNode;
  /** ツールチップの中身。開いたときだけ描画される */
  content: ReactNode;
}

// キーボードで選べるように tabIndex={0} の span で包む
export function Tooltip({ trigger, content }: TooltipProps) {
  const id = useId();
  const triggerRef = useRef<HTMLSpanElement>(null);
  const { isOpen, handlers } = useTooltip();

  return (
    <>
      <span
        ref={triggerRef}
        tabIndex={0}
        aria-describedby={isOpen ? id : undefined}
        className="inline-flex rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        {...handlers}
      >
        {trigger}
      </span>
      {isOpen && (
        <TooltipPanel id={id} triggerRef={triggerRef}>
          {content}
        </TooltipPanel>
      )}
    </>
  );
}
