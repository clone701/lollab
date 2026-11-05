import type { BuildElement, BuildOption } from '@/types/championBuild';

/** 試合数の多い上位の選択肢を返す（4〜6番目のアイテムの「OR」表示用） */
export function selectTopOptions(
  element: BuildElement,
  limit = 3
): BuildOption[] {
  return element.options.slice(0, limit);
}
