import { toContainerType } from '../toContainerType';

describe('toContainerType', () => {
  it.each([
    ['stats', 'stats'],
    ['attention', 'emphasis'],
    ['active', 'heading'],
    ['passive', 'heading'],
    ['keywordmajor', 'heading'],
    ['rules', 'aside'],
    ['flavortext', 'aside'],
    ['physicaldamage', 'physical'],
    ['scalead', 'physical'],
    ['magicdamage', 'magic'],
    ['scaleap', 'magic'],
    ['truedamage', 'trueDamage'],
    ['healing', 'heal'],
    ['scalehealth', 'heal'],
    ['lifesteal', 'heal'],
    ['shield', 'shield'],
    ['status', 'status'],
    ['scalemana', 'mana'],
    ['keyword', 'keyword'],
    ['keywordname', 'keyword'],
    ['keywordstealth', 'keyword'],
    ['spellname', 'keyword'],
    ['b', 'bold'],
    ['lol-uikit-tooltipped-keyword', 'term'],
    ['gold', 'gold'],
  ])('%s は %s になる', (tag, type) => {
    expect(toContainerType(tag)).toBe(type);
  });

  it('知らないタグは null', () => {
    expect(toContainerType('maintext')).toBeNull();
    expect(toContainerType('font')).toBeNull();
    expect(toContainerType('')).toBeNull();
  });
});
