import urgotFixture from '../__fixtures__/urgot.json';
import { highlightNumbers, highlightTerms, parseDescription } from '..';
import type { DescriptionNode } from '..';

const text = (t: string): DescriptionNode => ({ type: 'text', text: t });
const term = (
  type: 'status' | 'physical' | 'magic' | 'trueDamage' | 'shield' | 'heal',
  t: string
): DescriptionNode => ({ type, children: [text(t)] });
const highlight = (html: string): DescriptionNode[] =>
  highlightTerms(parseDescription(html));
const [spellQ, , spellE, spellR] = urgotFixture.data.Urgot.spells;

describe('highlightTerms', () => {
  it('Urgot E の「シールド」が shield になる', () => {
    expect(highlight(spellE.description)).toContainEqual(
      term('shield', 'シールド')
    );
  });

  it('Urgot R の「処刑」は対象外で文字のまま', () => {
    const nodes = highlight(spellR.description);
    expect(nodes.every((n) => n.type === 'text')).toBe(true);
  });

  it('Urgot Q の「物理ダメージ」が physical になる', () => {
    expect(highlight(spellQ.description)).toContainEqual(
      term('physical', '物理ダメージ')
    );
  });

  it('「スロウ効果」「スタン」が status になる（後ろの効果・状態も含める）', () => {
    expect(highlight('スロウ効果とスタン、スネア状態')).toEqual([
      term('status', 'スロウ効果'),
      text('と'),
      term('status', 'スタン'),
      text('、'),
      term('status', 'スネア状態'),
    ]);
  });

  it('「体力を回復」は1つの heal になり、「回復」だけでも heal になる', () => {
    expect(highlight('体力を回復し、回復する')).toEqual([
      term('heal', '体力を回復'),
      text('し、'),
      term('heal', '回復'),
      text('する'),
    ]);
  });

  it('魔法ダメージ・確定ダメージを分ける', () => {
    expect(highlight('魔法ダメージと確定ダメージ')).toEqual([
      term('magic', '魔法ダメージ'),
      text('と'),
      term('trueDamage', '確定ダメージ'),
    ]);
  });

  it('色の付いたノードの中は二重に分けない', () => {
    const html =
      '<status>スタン</status><physicalDamage>物理ダメージ</physicalDamage><trueDamage>確定ダメージ</trueDamage>';
    expect(highlight(html)).toEqual(parseDescription(html));
  });

  it('色の付かないノードの中の語は分ける', () => {
    expect(highlight('<stats>スタン</stats>')).toEqual([
      { type: 'stats', children: [term('status', 'スタン')] },
    ]);
  });

  it('続けて highlightNumbers を通しても、語は二重に分かれず数値だけ分かれる', () => {
    expect(highlightNumbers(highlight('スタン1.5秒とシールド'))).toEqual([
      term('status', 'スタン'),
      { type: 'number', children: [text('1.5秒')] },
      text('と'),
      term('shield', 'シールド'),
    ]);
  });

  it('語が無い文字はそのまま', () => {
    expect(highlight('あ<br>い')).toEqual([
      text('あ'),
      { type: 'lineBreak' },
      text('い'),
    ]);
  });
});
