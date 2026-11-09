import fc from 'fast-check';
import { parseDescription } from '..';
import type { DescriptionNode } from '..';

const FRAGMENTS = [
  '<br>',
  '<br/>',
  '<stats>',
  '</stats>',
  '<attention>',
  '</attention>',
  '<active>',
  '</active>',
  '<font color="#fff">',
  '</font>',
  '<script>',
  '</script>',
  '<',
  '>',
  '</',
  '<a',
  '/>',
];

/** タグの断片と任意の文字を混ぜた文字列 */
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

describe('parseDescription（性質）', () => {
  it('どんな文字列でも例外にならない', () => {
    fc.assert(
      fc.property(htmlLike, (html) => {
        expect(() => parseDescription(html)).not.toThrow();
      })
    );
  });

  it('& を含まない文字列では、文字をつなぐと元の文字列からタグを除いたものに等しい', () => {
    fc.assert(
      fc.property(
        htmlLike.filter((s) => !s.includes('&')),
        (html) => {
          const expected = html.replace(/<\/?[A-Za-z][^>]*>/g, '');
          expect(collectText(parseDescription(html))).toBe(expected);
        }
      )
    );
  });
});
