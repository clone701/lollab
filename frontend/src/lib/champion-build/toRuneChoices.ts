import type { BuildElement } from '@/types/championBuild';
import { calcPickShare } from './calcPickShare';
import { formatPercent } from './formatPercent';

/**
 * ルーンの切り替えボタンの選択肢（上位2件）。
 * value は options の添字、label は「1番目 ・ 採用率54%」
 */
export function toRuneChoices(
  element: BuildElement
): { value: string; label: string }[] {
  return element.options.slice(0, 2).map((option, index) => {
    const share = formatPercent(calcPickShare(option.games, element.games), 0);
    return {
      value: String(index),
      label: `${index + 1}番目 ・ 採用率${share}`,
    };
  });
}
