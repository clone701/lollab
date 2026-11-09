import { COLORED_TYPES, mapOutsideColored } from './mapOutsideColored';
import { splitTerms } from './splitTerms';
import type { DescriptionContainerType, DescriptionNode } from './types';

/** 語の色付けで中を分けないノード。色の付いたノードに確定ダメージも加える */
const SKIP_TYPES: ReadonlySet<DescriptionContainerType> = new Set([
  ...COLORED_TYPES,
  'trueDamage',
]);

/**
 * 色の付いたノードの外にある文字の、決まった語（状態異常・ダメージ・
 * シールド・回復）を、その役割のノードに分ける。
 * 色の付いたノードの中は、そのまま残す
 */
export function highlightTerms(nodes: DescriptionNode[]): DescriptionNode[] {
  return mapOutsideColored(nodes, splitTerms, SKIP_TYPES);
}
