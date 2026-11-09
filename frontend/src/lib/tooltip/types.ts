/** トリガー（アイコン）の位置と大きさ。`getBoundingClientRect()` の結果をそのまま渡せる */
export interface TooltipTriggerRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface TooltipSize {
  width: number;
  height: number;
}

export type TooltipPlacement = 'bottom' | 'top';

/** 画面（viewport）の左上を原点にした位置。`position: fixed` で使う */
export interface TooltipPosition {
  top: number;
  left: number;
  placement: TooltipPlacement;
}
