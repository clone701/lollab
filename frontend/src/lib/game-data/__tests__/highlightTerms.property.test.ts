import fc from 'fast-check';
import { highlightTerms, parseDescription } from '..';
import type { DescriptionNode } from '..';

const FRAGMENTS = [
  '<br>',
  '<status>',
  '</status>',
  '<stats>',
  '</stats>',
  '<trueDamage>',
  '</trueDamage>',
  'スロウ',
  'スタン',
  '効果',
  '状態',
  '物理ダメージ',
  '魔法ダメージ',
  '確定ダメージ',
  '体力を回復',
  '回復',
  'シールド',
  '処刑',
  '<',
  '>',
];

/** 語やタグの断片と任意の文字を混ぜた文字列 */
const htmlLike = fc
  .array(fc.oneof(fc.string(), fc.constantFrom(...FRAGMENTS)))
  .map((parts) => parts.join(''));

function collectText(nodes: DescriptionNode[]): string {
  return nodes
    .map((n) => {
      if (n.type === 'text') return n.text;
      if (n.type === 'lineBreak') return '';
      return collectText(n.children);
    })
    .join('');
}

describe('highlightTerms（性質）', () => {
  it('どんな文字列でも例外にならない', () => {
    fc.assert(
      fc.property(htmlLike, (html) => {
        expect(() => highlightTerms(parseDescription(html))).not.toThrow();
      })
    );
  });

  it('文字をつなぐと元と等しい', () => {
    fc.assert(
      fc.property(htmlLike, (html) => {
        const nodes = parseDescription(html);
        expect(collectText(highlightTerms(nodes))).toBe(collectText(nodes));
      })
    );
  });
});
