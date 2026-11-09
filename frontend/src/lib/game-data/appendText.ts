import { decodeEntities } from './decodeEntities';
import type { DescriptionNode } from './types';

/** 文字を末尾に足す。文字参照を戻し、直前も文字ならつなげて1つにする（空文字は足さない） */
export function appendText(nodes: DescriptionNode[], text: string): void {
  if (!text) return;
  const decoded = decodeEntities(text);
  const last = nodes[nodes.length - 1];
  if (last && last.type === 'text') {
    nodes[nodes.length - 1] = { type: 'text', text: last.text + decoded };
  } else {
    nodes.push({ type: 'text', text: decoded });
  }
}
