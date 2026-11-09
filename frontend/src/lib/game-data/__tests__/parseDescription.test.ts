import itemFixture from '../__fixtures__/item.json';
import { parseDescription } from '..';
import type { DescriptionNode } from '..';

const text = (t: string): DescriptionNode => ({ type: 'text', text: t });
const br: DescriptionNode = { type: 'lineBreak' };

describe('parseDescription', () => {
  it('<br> が改行になる', () => {
    expect(parseDescription('a<br>b<br/>c')).toEqual([
      text('a'),
      br,
      text('b'),
      br,
      text('c'),
    ]);
  });

  it('stats・attention・active・rules が決めたノードになる', () => {
    expect(
      parseDescription(
        '<stats>魔力<attention>105</attention></stats><active>時間停止</active><rules>注意</rules>'
      )
    ).toEqual([
      {
        type: 'stats',
        children: [text('魔力'), { type: 'emphasis', children: [text('105')] }],
      },
      { type: 'heading', children: [text('時間停止')] },
      { type: 'aside', children: [text('注意')] },
    ]);
  });

  it('passive・keywordMajor は見出し、flavorText は補足になる', () => {
    expect(
      parseDescription('<passive>a</passive><keywordMajor>b</keywordMajor>')
    ).toEqual([
      { type: 'heading', children: [text('a')] },
      { type: 'heading', children: [text('b')] },
    ]);
    expect(parseDescription('<flavorText>f</flavorText>')).toEqual([
      { type: 'aside', children: [text('f')] },
    ]);
  });

  it('知らないタグは外れて文字が残る', () => {
    expect(
      parseDescription(
        '<mainText>100の<unknownTag>ダメージ</unknownTag><font>鈍化</font></mainText>'
      )
    ).toEqual([text('100のダメージ鈍化')]);
  });

  it('ダメージ・回復などのタグが決めたノードになる（大文字小文字は区別しない）', () => {
    expect(
      parseDescription(
        '<physicalDamage>a</physicalDamage><scaleAD>b</scaleAD><magicDamage>c</magicDamage><trueDamage>d</trueDamage><healing>e</healing><shield>f</shield><status>g</status><scaleMana>h</scaleMana><keywordName>i</keywordName><gold>j</gold>'
      )
    ).toEqual([
      { type: 'physical', children: [text('a')] },
      { type: 'physical', children: [text('b')] },
      { type: 'magic', children: [text('c')] },
      { type: 'trueDamage', children: [text('d')] },
      { type: 'heal', children: [text('e')] },
      { type: 'shield', children: [text('f')] },
      { type: 'status', children: [text('g')] },
      { type: 'mana', children: [text('h')] },
      { type: 'keyword', children: [text('i')] },
      { type: 'gold', children: [text('j')] },
    ]);
  });

  it('色のタグの中に入れ子のタグがあっても木になる', () => {
    expect(
      parseDescription('<physicalDamage>a<scaleAD>b</scaleAD></physicalDamage>')
    ).toEqual([
      {
        type: 'physical',
        children: [text('a'), { type: 'physical', children: [text('b')] }],
      },
    ]);
  });

  it('入れ子のタグを木にする', () => {
    expect(
      parseDescription('<stats>a<attention>b<br>c</attention>d</stats>e')
    ).toEqual([
      {
        type: 'stats',
        children: [
          text('a'),
          { type: 'emphasis', children: [text('b'), br, text('c')] },
          text('d'),
        ],
      },
      text('e'),
    ]);
  });

  it('閉じていないタグでも文字が残る', () => {
    expect(parseDescription('<stats>a<attention>b')).toEqual([
      {
        type: 'stats',
        children: [text('a'), { type: 'emphasis', children: [text('b')] }],
      },
    ]);
  });

  it('対応しない終了タグ・壊れたタグでも例外にならず、文字が残る', () => {
    expect(parseDescription('a</stats>b')).toEqual([text('ab')]);
    expect(parseDescription('a<stats')).toEqual([text('a<stats')]);
    expect(parseDescription('1 < 2 > 0')).toEqual([text('1 < 2 > 0')]);
    expect(parseDescription('<>x</>')).toEqual([text('<>x</>')]);
  });

  it('外側を閉じると、閉じ忘れた内側も閉じる', () => {
    expect(parseDescription('<stats>a<attention>b</stats>c')).toEqual([
      {
        type: 'stats',
        children: [text('a'), { type: 'emphasis', children: [text('b')] }],
      },
      text('c'),
    ]);
  });

  it('&nbsp; &amp; &lt; &gt; が戻り、二重には戻らない', () => {
    expect(parseDescription('a&nbsp;b &amp; &lt;c&gt; &amp;lt;')).toEqual([
      text('a\u00a0b & <c> &lt;'),
    ]);
  });

  it('<script> は外れ、中身は文字として残るだけ', () => {
    expect(parseDescription('<script>alert(1)</script>')).toEqual([
      text('alert(1)'),
    ]);
  });

  it('空文字は空配列', () => {
    expect(parseDescription('')).toEqual([]);
  });

  it('ゾーニャの砂時計の説明を変換できる', () => {
    const nodes = parseDescription(itemFixture.data['3157'].description);
    expect(nodes[0]).toEqual({
      type: 'stats',
      children: [
        text('魔力'),
        { type: 'emphasis', children: [text('105')] },
        br,
        text('物理防御 '),
        { type: 'emphasis', children: [text('50')] },
      ],
    });
    expect(nodes).toContainEqual({
      type: 'heading',
      children: [text('時間停止')],
    });
    expect(nodes.slice(-3)).toEqual([
      text('2.5秒間'),
      { type: 'keyword', children: [text('固有時停止')] },
      text('状態になる。'),
    ]);
  });
});
