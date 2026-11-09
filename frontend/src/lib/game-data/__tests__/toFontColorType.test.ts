import { toFontColorType } from '..';

describe('toFontColorType', () => {
  it.each([
    ['#FFF673', 'number'],
    ['#48C4B7', 'term'],
    ['#91D7EE', 'term'],
    ['#FF9900', 'physical'],
    ['#FE5C50', 'physical'],
    ['#DD2E2E', 'physical'],
    ['#00DD33', 'heal'],
    ['#669900', 'heal'],
    ['#1CA935', 'heal'],
    ['#38A8E8', 'shield'],
    ['#EE91D7', 'status'],
    ['#9B0F5F', 'status'],
  ])('%s は %s になる', (hex, type) => {
    expect(toFontColorType(hex)).toBe(type);
  });

  it('小文字でも同じ', () => {
    expect(toFontColorType('#48c4b7')).toBe('term');
  });

  it('白・灰色など色相で分けられない色は null', () => {
    expect(toFontColorType('#FFFFFF')).toBeNull();
    expect(toFontColorType('#808080')).toBeNull();
  });

  it('不正な値は null', () => {
    expect(toFontColorType('red')).toBeNull();
    expect(toFontColorType('#FFF')).toBeNull();
    expect(toFontColorType('#GG0000')).toBeNull();
    expect(toFontColorType('')).toBeNull();
  });
});
