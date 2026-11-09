import itemFixture from '../__fixtures__/item.json';
import runeFixture from '../__fixtures__/runes.json';
import summonerFixture from '../__fixtures__/summoner.json';
import { toItemInfo, toRuneInfo, toSpellInfo } from '..';

describe('toItemInfo', () => {
  it('名前・合計価格・説明を返す', () => {
    const info = toItemInfo(itemFixture, 3157);
    expect(info?.name).toBe('ゾーニャの砂時計');
    expect(info?.totalGold).toBe(3250);
    expect(info?.description).toContain('<active>時間停止</active>');
  });

  it('文字列の ID でも引ける', () => {
    expect(toItemInfo(itemFixture, '3157')?.name).toBe('ゾーニャの砂時計');
  });

  it('無い ID は null', () => {
    expect(toItemInfo(itemFixture, 9999)).toBeNull();
    expect(toItemInfo(itemFixture, 'constructor')).toBeNull();
  });
});

describe('toRuneInfo', () => {
  it('ルーンは名前と longDesc を返す', () => {
    const info = toRuneInfo(runeFixture, 8112);
    expect(info?.name).toBe('電撃');
    expect(info?.description).toBe(runeFixture[0].slots[0].runes[0].longDesc);
  });

  it('パスは名前だけ（description なし）', () => {
    const info = toRuneInfo(runeFixture, 8100);
    expect(info).toEqual({ name: '覇道' });
    expect(info).not.toHaveProperty('description');
  });

  it('ステータスシャード・無い ID は null', () => {
    expect(toRuneInfo(runeFixture, 5001)).toBeNull();
    expect(toRuneInfo(runeFixture, 1)).toBeNull();
  });
});

describe('toSpellInfo', () => {
  it('数値の ID（key）で引ける。名前・CD・説明を返す', () => {
    expect(toSpellInfo(summonerFixture, 4)).toEqual({
      name: 'フラッシュ',
      cooldownBurn: '300',
      description:
        '自身のチャンピオンを短い距離、指定した方向に瞬間移動させる。',
    });
  });

  it('文字列の ID でも引ける', () => {
    expect(toSpellInfo(summonerFixture, '4')?.name).toBe('フラッシュ');
  });

  it('文字の ID（SummonerFlash）でも引ける', () => {
    expect(toSpellInfo(summonerFixture, 'SummonerFlash')).toEqual(
      toSpellInfo(summonerFixture, 4)
    );
  });

  it('無い ID は null', () => {
    expect(toSpellInfo(summonerFixture, 999)).toBeNull();
    expect(toSpellInfo(summonerFixture, 'SummonerNone')).toBeNull();
    expect(toSpellInfo(summonerFixture, 'constructor')).toBeNull();
  });
});
