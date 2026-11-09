import type { TooltipPosition, TooltipSize, TooltipTriggerRect } from './types';

/** トリガーとパネルの間隔（px） */
const GAP = 8;
/** 画面の端に空ける余白（px） */
const MARGIN = 8;

/**
 * ツールチップの位置を決める。トリガーの下に出し、下にはみ出して上に収まるなら上に出す。
 * 左右はトリガーの中央に合わせ、画面内に収める（パネルが画面より大きいときは左端に寄せる）
 */
export function calcTooltipPosition(
  trigger: TooltipTriggerRect,
  panel: TooltipSize,
  viewport: TooltipSize
): TooltipPosition {
  const belowTop = trigger.top + trigger.height + GAP;
  const aboveTop = trigger.top - GAP - panel.height;
  const fitsBelow = belowTop + panel.height + MARGIN <= viewport.height;
  const fitsAbove = aboveTop >= MARGIN;
  const placement = !fitsBelow && fitsAbove ? 'top' : 'bottom';

  const centered = trigger.left + trigger.width / 2 - panel.width / 2;
  const maxLeft = viewport.width - panel.width - MARGIN;
  const left = Math.max(MARGIN, Math.min(centered, maxLeft));

  return {
    top: placement === 'top' ? aboveTop : belowTop,
    left,
    placement,
  };
}
