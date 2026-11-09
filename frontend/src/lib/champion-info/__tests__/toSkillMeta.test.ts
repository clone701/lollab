import { toChampionSkills } from '@/lib/game-data';
import urgotFixture from '@/lib/game-data/__fixtures__/urgot.json';
import { toSkillMeta } from '..';

const [passive, q] = toChampionSkills(urgotFixture);

describe('toSkillMeta', () => {
  it('スキルは CD・コスト・射程の文字を返す', () => {
    expect(toSkillMeta(q)).toEqual({
      cooldown: '10/9.5/9/8.5/8 秒',
      cost: '70 マナ',
      range: '800',
    });
  });

  it('パッシブはすべて null', () => {
    expect(toSkillMeta(passive)).toEqual({
      cooldown: null,
      cost: null,
      range: null,
    });
  });

  it('コスト 0 と射程 0 は null', () => {
    expect(toSkillMeta({ ...q, costBurn: '0', rangeBurn: '0' })).toMatchObject({
      cost: null,
      range: null,
    });
  });
});
