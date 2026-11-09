'use client';

import { useRef } from 'react';
import type { ReactNode, RefObject } from 'react';
import { createPortal } from 'react-dom';
import { usePanelPosition } from './usePanelPosition';

interface TooltipPanelProps {
  id: string;
  triggerRef: RefObject<HTMLElement | null>;
  children: ReactNode;
}

// body 直下に出す（overflow のある親の中でも切れない）。位置を測るまでは見えなくする
export function TooltipPanel({ id, triggerRef, children }: TooltipPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const position = usePanelPosition(triggerRef, panelRef);
  const style = position
    ? { top: position.top, left: position.left }
    : { top: 0, left: 0, visibility: 'hidden' as const };

  return createPortal(
    <div
      ref={panelRef}
      id={id}
      role="tooltip"
      style={style}
      className="fixed z-50 w-max max-w-xs rounded-lg border border-line-strong bg-surface p-3 text-sm text-fg shadow-md"
    >
      {children}
    </div>,
    document.body
  );
}
