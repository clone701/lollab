import { formatStat, toRoleLabel } from '..';

describe('toRoleLabel', () => {
  it('6つの役割を日本語にする', () => {
    expect(
      ['Fighter', 'Tank', 'Mage', 'Assassin', 'Marksman', 'Support'].map(
        toRoleLabel
      )
    ).toEqual([
      'ファイター',
      'タンク',
      'メイジ',
      'アサシン',
      'マークスマン',
      'サポート',
    ]);
  });

  it('知らない値はそのまま返す', () => {
    expect(toRoleLabel('Unknown')).toBe('Unknown');
    expect(toRoleLabel('toString')).toBe('toString');
  });
});

describe('formatStat', () => {
  it('整数はそのまま、小数は第2位まで・末尾の0なし', () => {
    expect(formatStat(655)).toBe('655');
    expect(formatStat(2.05)).toBe('2.05');
    expect(formatStat(7.5)).toBe('7.5');
    expect(formatStat(19.4)).toBe('19.4');
    expect(formatStat(66.8499999)).toBe('66.85');
    expect(formatStat(0.7)).toBe('0.7');
  });

  it('第3位は四捨五入する', () => {
    expect(formatStat(1.236)).toBe('1.24');
    expect(formatStat(1.001)).toBe('1');
  });

  it('桁数を指定できる（攻撃速度は第3位まで）', () => {
    expect(formatStat(1.0234, 3)).toBe('1.023');
    expect(formatStat(0.625, 3)).toBe('0.625');
    expect(formatStat(0.6, 3)).toBe('0.6');
  });
});
