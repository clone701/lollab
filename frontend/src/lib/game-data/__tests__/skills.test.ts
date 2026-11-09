import monkeyKingFixture from '../__fixtures__/monkeyKing.json';
import urgotFixture from '../__fixtures__/urgot.json';
import {
  formatCooldown,
  formatCost,
  toChampionSkills,
  toDdragonChampionKey,
} from '..';

describe('toChampionSkills', () => {
  const skills = toChampionSkills(urgotFixture);

  it('パッシブと Q/W/E/R の順に返す', () => {
    expect(skills.map((s) => s.key)).toEqual(['P', 'Q', 'W', 'E', 'R']);
    expect(skills[0].name).toBe('エコーフレイム');
    expect(skills[1].name).toBe('コラプトシェル');
  });

  it('画像パスはスキルが spell、パッシブが passive', () => {
    expect(skills[0].imagePath).toBe('/images/img/passive/Urgot_Passive.png');
    expect(skills[1].imagePath).toBe('/images/img/spell/UrgotQ.png');
    expect(skills[4].imagePath).toBe('/images/img/spell/UrgotR.png');
  });

  it('スキルは CD・コスト・コストの種類を持ち、パッシブは CD・コストが null', () => {
    expect(skills[1]).toMatchObject({
      cooldownBurn: '10/9.5/9/8.5/8',
      costBurn: '70',
      partype: 'マナ',
    });
    expect(skills[0]).toMatchObject({ cooldownBurn: null, costBurn: null });
  });

  it('ウーコン（MonkeyKing）のデータも変換できる', () => {
    const wukong = toChampionSkills(monkeyKingFixture);
    expect(wukong[0].imagePath).toBe(
      '/images/img/passive/MonkeyKingStoneSkin.png'
    );
    expect(wukong[4].imagePath).toBe(
      '/images/img/spell/MonkeyKingSpinToWin.png'
    );
  });

  it('チャンピオンが無いデータは空配列', () => {
    expect(toChampionSkills({ data: {} })).toEqual([]);
  });
});

describe('formatCooldown', () => {
  it('末尾に「 秒」を付ける', () => {
    expect(formatCooldown('10/9.5/9/8.5/8')).toBe('10/9.5/9/8.5/8 秒');
    expect(formatCooldown('300')).toBe('300 秒');
  });
});

describe('formatCost', () => {
  it('コストと種類をつなぐ', () => {
    expect(formatCost('70', 'マナ')).toBe('70 マナ');
    expect(formatCost('60/55/50/45/40', 'エネルギー')).toBe(
      '60/55/50/45/40 エネルギー'
    );
  });

  it('costBurn が 0 なら null', () => {
    expect(formatCost('0', 'マナ')).toBeNull();
  });

  it('種類が空なら costBurn だけ', () => {
    expect(formatCost('70', '')).toBe('70');
  });
});

describe('toDdragonChampionKey', () => {
  it('Wukong だけ MonkeyKing になる', () => {
    expect(toDdragonChampionKey('Wukong')).toBe('MonkeyKing');
    expect(toDdragonChampionKey('Fiddlesticks')).toBe('Fiddlesticks');
    expect(toDdragonChampionKey('Urgot')).toBe('Urgot');
  });
});
