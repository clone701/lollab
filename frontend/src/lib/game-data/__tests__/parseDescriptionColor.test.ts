import runeFixture from '../__fixtures__/runes.json';
import { parseDescription } from '..';
import type { DescriptionNode } from '..';

const text = (t: string): DescriptionNode => ({ type: 'text', text: t });

describe('parseDescription（font・b・用語のタグ）', () => {
  it("font の color が ' で囲まれていても読む", () => {
    expect(parseDescription("<font color='#FF9900'>a</font>")).toEqual([
      { type: 'physical', children: [text('a')] },
    ]);
  });

  it('font の color が " で囲まれていても読む', () => {
    expect(parseDescription('<font color="#00DD33">a</font>')).toEqual([
      { type: 'heal', children: [text('a')] },
    ]);
  });

  it('不正な color・color なしの font はタグを外して文字を残す', () => {
    expect(parseDescription("<font color='red'>a</font>")).toEqual([text('a')]);
    expect(parseDescription('<font color=#FF9900>b</font>')).toEqual([
      text('b'),
    ]);
    expect(parseDescription("<font color='#FFF'>c</font>")).toEqual([
      text('c'),
    ]);
    expect(parseDescription('<font>d</font>')).toEqual([text('d')]);
  });

  it('b は太字、lol-uikit-tooltipped-keyword は用語になる', () => {
    expect(
      parseDescription(
        "<b>a</b><lol-uikit-tooltipped-keyword key='k'>b</lol-uikit-tooltipped-keyword>"
      )
    ).toEqual([
      { type: 'bold', children: [text('a')] },
      { type: 'term', children: [text('b')] },
    ]);
  });

  it('征服者の「アダプティブフォース」が用語のノードになる', () => {
    const nodes = parseDescription(runeFixture[1].slots[0].runes[0].longDesc);
    expect(nodes).toContainEqual({
      type: 'term',
      children: [{ type: 'term', children: [text('アダプティブフォース')] }],
    });
  });
});
