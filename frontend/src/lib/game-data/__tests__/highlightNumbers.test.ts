import runeFixture from '../__fixtures__/runes.json';
import { highlightNumbers, parseDescription } from '..';
import type { DescriptionNode } from '..';

const text = (t: string): DescriptionNode => ({ type: 'text', text: t });
const num = (t: string): DescriptionNode => ({
  type: 'number',
  children: [text(t)],
});
const highlight = (html: string): DescriptionNode[] =>
  highlightNumbers(parseDescription(html));

describe('highlightNumbers', () => {
  it('小数・範囲・単位を含む数値をノードに分ける', () => {
    expect(highlight('a1.8 - 4b8%c20秒d15 - 100e20 - 8秒f５％')).toEqual([
      text('a'),
      num('1.8 - 4'),
      text('b'),
      num('8%'),
      text('c'),
      num('20秒'),
      text('d'),
      num('15 - 100'),
      text('e'),
      num('20 - 8秒'),
      text('f５％'),
    ]);
  });

  it('全角の ％ も単位に含める', () => {
    expect(highlight('5％')).toEqual([num('5％')]);
  });

  it('数値が無い文字はそのまま', () => {
    expect(highlight('あ<br>い')).toEqual([
      text('あ'),
      { type: 'lineBreak' },
      text('い'),
    ]);
  });

  it('色の付いたノードの中の数値は分けない', () => {
    const html = '<physicalDamage>100</physicalDamage><active>2秒</active>';
    expect(highlight(html)).toEqual(parseDescription(html));
  });

  it('色の付かないノードの中の数値は分ける', () => {
    expect(highlight('<stats>魔力<attention>105</attention></stats>')).toEqual([
      {
        type: 'stats',
        children: [text('魔力'), { type: 'emphasis', children: [num('105')] }],
      },
    ]);
  });

  it('文字をつなげると元と変わらない', () => {
    const html = '<b>3回</b>で1.8 - 4の8%';
    const collect = (nodes: DescriptionNode[]): string =>
      nodes
        .map((n) =>
          n.type === 'text'
            ? n.text
            : n.type === 'lineBreak'
              ? ''
              : collect(n.children)
        )
        .join('');
    expect(collect(highlight(html))).toBe(collect(parseDescription(html)));
  });

  it('征服者の「1.8 - 4」と「8%」が数値のノードになる', () => {
    const nodes = highlight(runeFixture[1].slots[0].runes[0].longDesc);
    expect(nodes).toContainEqual(num('1.8 - 4'));
    expect(nodes).toContainEqual(num('8%'));
  });

  it('征服者の「アダプティブフォース」は用語のノードのまま', () => {
    const nodes = highlight(runeFixture[1].slots[0].runes[0].longDesc);
    expect(nodes.filter((n) => n.type === 'term')).toHaveLength(1);
  });
});
