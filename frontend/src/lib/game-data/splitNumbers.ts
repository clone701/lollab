import type { DescriptionNode } from './types';

/** 数値: 小数、範囲（`1.8 - 4`・`20 - 8秒`）、単位（%・％・秒）を含む */
const NUMBER_PATTERN = /\d+(?:\.\d+)?(?:\s*-\s*\d+(?:\.\d+)?)*[%％秒]?/g;

/** 文字を、数値のノードとそれ以外の文字のノードに分ける */
export function splitNumbers(text: string): DescriptionNode[] {
  const nodes: DescriptionNode[] = [];
  let last = 0;
  for (const match of text.matchAll(NUMBER_PATTERN)) {
    const index = match.index ?? 0;
    if (index > last)
      nodes.push({ type: 'text', text: text.slice(last, index) });
    nodes.push({
      type: 'number',
      children: [{ type: 'text', text: match[0] }],
    });
    last = index + match[0].length;
  }
  if (last < text.length) nodes.push({ type: 'text', text: text.slice(last) });
  return nodes;
}
