import {
  QUEUE_OPTIONS,
  calcPickShare,
  calcWinRate,
  formatPercent,
  formatSignedPercent,
  formatSkillPriority,
  rateColorClass,
  splitRuneKey,
  toRuneChoices,
  toSkillGrid,
} from '..';
import type { BuildElement } from '@/types/championBuild';

describe('calcPickShare', () => {
  it('選択肢の試合数 / 要素の試合数を返す', () => {
    expect(calcPickShare(443, 878)).toBeCloseTo(0.5046, 4);
    expect(calcPickShare(30, 30)).toBe(1);
  });

  it('要素の試合数が 0 以下のときは 0', () => {
    expect(calcPickShare(0, 0)).toBe(0);
    expect(calcPickShare(5, 0)).toBe(0);
  });
});

describe('rateColorClass', () => {
  it('基準以上は勝ち色、基準未満は負け色', () => {
    expect(rateColorClass(0.5, 0.5, true)).toBe('text-win');
    expect(rateColorClass(0.499, 0.5, true)).toBe('text-loss');
    expect(rateColorClass(0, 0, true)).toBe('text-win');
    expect(rateColorClass(-0.001, 0, true)).toBe('text-loss');
  });

  it('試合数が 0 のときは本文色', () => {
    expect(rateColorClass(0, 0.5, false)).toBe('text-fg');
  });
});

describe('QUEUE_OPTIONS', () => {
  it('all の表示名は「すべて」で、値は all のまま', () => {
    expect(QUEUE_OPTIONS[0]).toEqual({ value: 'all', label: 'すべて' });
  });
});

describe('toRuneChoices', () => {
  const runes: BuildElement = {
    games: 100,
    options: [
      { key: [1], games: 54, wins: 30 },
      { key: [2], games: 18, wins: 9 },
      { key: [3], games: 10, wins: 5 },
    ],
  };

  it('上位2件を「1番目 ・ 採用率54%」の形にする', () => {
    expect(toRuneChoices(runes)).toEqual([
      { value: '0', label: '1番目 ・ 採用率54%' },
      { value: '1', label: '2番目 ・ 採用率18%' },
    ]);
  });

  it('選択肢が1件なら1件だけ、0件なら空', () => {
    expect(
      toRuneChoices({ ...runes, options: runes.options.slice(0, 1) })
    ).toHaveLength(1);
    expect(toRuneChoices({ games: 0, options: [] })).toEqual([]);
  });
});

describe('calcWinRate', () => {
  it('勝利数 / 試合数を返す', () => {
    expect(calcWinRate(55, 100)).toBe(0.55);
    expect(calcWinRate(1, 3)).toBeCloseTo(0.3333, 4);
  });

  it('試合数が 0 以下のときは 0', () => {
    expect(calcWinRate(0, 0)).toBe(0);
    expect(calcWinRate(5, 0)).toBe(0);
  });
});

describe('formatPercent', () => {
  it('0〜1 の比率を % にする', () => {
    expect(formatPercent(0.5234)).toBe('52.3%');
    expect(formatPercent(0)).toBe('0.0%');
    expect(formatPercent(1)).toBe('100.0%');
    expect(formatPercent(0.0834, 2)).toBe('8.34%');
  });

  it('数値でない値は「-」', () => {
    expect(formatPercent(NaN)).toBe('-');
  });
});

describe('formatSignedPercent', () => {
  it('正の差には + を付ける', () => {
    expect(formatSignedPercent(0.0123)).toBe('+1.2%');
  });

  it('負の差には - を付ける', () => {
    expect(formatSignedPercent(-0.008)).toBe('-0.8%');
  });

  it('丸めて 0 になる差は符号なし', () => {
    expect(formatSignedPercent(0)).toBe('0.0%');
    expect(formatSignedPercent(-0.0001)).toBe('0.0%');
  });
});

describe('formatSkillPriority', () => {
  it('キーを Q > W > E 表記にする', () => {
    expect(formatSkillPriority([1, 2, 3])).toBe('Q > W > E');
    expect(formatSkillPriority([3, 1, 2])).toBe('E > Q > W');
  });
});

describe('toSkillGrid', () => {
  it('4行×15列で、レベルごとに上げるスキルの行だけ true', () => {
    const grid = toSkillGrid([1, 2, 3, 1, 1, 4]);
    expect(grid).toHaveLength(4);
    expect(grid.every((row) => row.length === 15)).toBe(true);
    expect(grid[0].slice(0, 6)).toEqual([
      true,
      false,
      false,
      true,
      true,
      false,
    ]);
    expect(grid[3][5]).toBe(true);
    // キーが短いレベルはどの行も false
    expect(grid.every((row) => row[14] === false)).toBe(true);
  });

  it('各レベルでちょうど1行が true（15個そろっているとき）', () => {
    const key = [1, 2, 3, 1, 1, 4, 1, 2, 1, 2, 4, 2, 2, 3, 3];
    const grid = toSkillGrid(key);
    for (let col = 0; col < 15; col++) {
      expect(grid.filter((row) => row[col])).toHaveLength(1);
    }
  });
});

describe('splitRuneKey', () => {
  it('11個のキーをメイン・サブ・シャードに分ける', () => {
    const key = [8100, 1, 2, 3, 4, 8200, 5, 6, 7, 8, 9];
    expect(splitRuneKey(key)).toEqual({
      primaryStyle: 8100,
      primary: [1, 2, 3, 4],
      subStyle: 8200,
      sub: [5, 6],
      shards: [7, 8, 9],
    });
  });

  it('11個でなければ null', () => {
    expect(splitRuneKey([1, 2, 3])).toBeNull();
  });
});
