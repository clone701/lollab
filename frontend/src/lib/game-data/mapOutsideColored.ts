import type { DescriptionContainerType, DescriptionNode } from './types';

/** 色の付いたノード。中の文字は分けない */
export const COLORED_TYPES: ReadonlySet<DescriptionContainerType> = new Set([
  'physical',
  'magic',
  'heal',
  'shield',
  'status',
  'mana',
  'keyword',
  'term',
  'gold',
  'heading',
  'number',
]);

/**
 * 色の付いたノードの外にある text だけを split で分ける。
 * skipTypes のノードの中は、そのまま残す
 */
export function mapOutsideColored(
  nodes: DescriptionNode[],
  split: (text: string) => DescriptionNode[],
  skipTypes: ReadonlySet<DescriptionContainerType> = COLORED_TYPES
): DescriptionNode[] {
  return nodes.flatMap((node): DescriptionNode[] => {
    if (node.type === 'text') return split(node.text);
    if (node.type === 'lineBreak' || skipTypes.has(node.type)) return [node];
    return [
      { ...node, children: mapOutsideColored(node.children, split, skipTypes) },
    ];
  });
}
