import { appendText } from './appendText';
import { toContainerType } from './toContainerType';
import { toFontType } from './toFontType';
import type { DescriptionNode } from './types';

/** 開始・終了タグ。閉じていないタグ（`>` が無い）は一致せず、文字として残る */
const TAG_PATTERN = /<(\/?)([A-Za-z][^\s/>]*)[^>]*>/g;

interface Frame {
  name: string;
  children: DescriptionNode[];
}

/**
 * 説明文の HTML 風の文字列を DescriptionNode[] にする。
 * 決めたタグだけをノードにし、知らないタグは外して中の文字を残す。例外は投げない
 */
export function parseDescription(html: string): DescriptionNode[] {
  const root: Frame = { name: '', children: [] };
  const stack: Frame[] = [root];
  const current = (): DescriptionNode[] => stack[stack.length - 1].children;
  const addText = (text: string): void => appendText(current(), text);

  let last = 0;
  for (const match of html.matchAll(TAG_PATTERN)) {
    const index = match.index ?? 0;
    addText(html.slice(last, index));
    last = index + match[0].length;

    const isClosing = match[1] === '/';
    const name = match[2].toLowerCase();
    if (name === 'br') {
      if (!isClosing) current().push({ type: 'lineBreak' });
      continue;
    }
    if (isClosing) {
      // 対応する開始タグまで閉じる。対応するものが無ければ無視する
      for (let i = stack.length - 1; i > 0; i--) {
        if (stack[i].name === name) {
          stack.length = i;
          break;
        }
      }
      continue;
    }
    // font は color 属性の色の系統で種類を決める
    const type = name === 'font' ? toFontType(match[0]) : toContainerType(name);
    if (!type || match[0].endsWith('/>')) continue;
    const children: DescriptionNode[] = [];
    current().push({ type, children });
    stack.push({ name, children });
  }
  addText(html.slice(last));
  return root.children;
}
