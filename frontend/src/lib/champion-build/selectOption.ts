import type {
  BuildElement,
  BuildMode,
  BuildOption,
} from '@/types/championBuild';

/** 表示モードに応じて要素の選択肢を1つ選ぶ。最多は options[0]、最高勝率は best_win_rate */
export function selectOption(
  element: BuildElement,
  mode: BuildMode
): BuildOption | null {
  if (mode === 'best_win_rate') return element.best_win_rate ?? null;
  return element.options[0] ?? null;
}
