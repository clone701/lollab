import { mapOutsideColored } from './mapOutsideColored';
import { splitNumbers } from './splitNumbers';
import type { DescriptionNode } from './types';

/**
 * 色の付いたノードの外にある文字の数値を、数値のノードに分ける。
 * 色の付いたノードの中は、そのまま残す
 */
export function highlightNumbers(nodes: DescriptionNode[]): DescriptionNode[] {
  return mapOutsideColored(nodes, splitNumbers);
}
