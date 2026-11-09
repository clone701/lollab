import urgotFixture from '@/lib/game-data/__fixtures__/urgot.json';
import { calcAttackSpeedAtLevel, calcStatAtLevel } from '..';

const { stats } = urgotFixture.data.Urgot;

describe('calcStatAtLevel', () => {
  it('アーゴットの Lv.18: 体力 2389・物理防御 121・魔法防御 66.85', () => {
    expect(calcStatAtLevel(stats.hp, stats.hpperlevel, 18)).toBeCloseTo(
      2389,
      5
    );
    expect(calcStatAtLevel(stats.armor, stats.armorperlevel, 18)).toBeCloseTo(
      121,
      5
    );
    expect(
      calcStatAtLevel(stats.spellblock, stats.spellblockperlevel, 18)
    ).toBeCloseTo(66.85, 5);
  });

  it('Lv.1 は基礎のまま', () => {
    expect(calcStatAtLevel(stats.hp, stats.hpperlevel, 1)).toBe(655);
  });
});

describe('calcAttackSpeedAtLevel', () => {
  it('アーゴットの Lv.18: 1.023（基礎 0.625、成長 3.75%）', () => {
    const value = calcAttackSpeedAtLevel(
      stats.attackspeed,
      stats.attackspeedperlevel,
      18
    );
    expect(value).toBeCloseTo(1.0234, 4);
    expect(Math.round(value * 1000) / 1000).toBe(1.023);
  });

  it('Lv.1 は基礎のまま', () => {
    expect(calcAttackSpeedAtLevel(0.625, 3.75, 1)).toBe(0.625);
  });
});
