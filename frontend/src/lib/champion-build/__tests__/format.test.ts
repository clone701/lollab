import {
  calcWinRate,
  formatPercent,
  formatSignedPercent,
  formatSkillPriority,
  selectOption,
  selectTopOptions,
  splitRuneKey,
  toSkillGrid,
} from '..';
import type { BuildElement } from '@/types/championBuild';

const element: BuildElement = {
  games: 30,
  options: [
    { key: [1], games: 20, wins: 8 },
    { key: [2], games: 10, wins: 9 },
  ],
  best_win_rate: { key: [2], games: 10, wins: 9 },
};

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

describe('selectOption', () => {
  it('最多は options[0]、最高勝率は best_win_rate を返す', () => {
    expect(selectOption(element, 'most_games')).toBe(element.options[0]);
    expect(selectOption(element, 'best_win_rate')).toBe(element.best_win_rate);
  });

  it('選択肢がなければ null', () => {
    const empty: BuildElement = { games: 0, options: [], best_win_rate: null };
    expect(selectOption(empty, 'most_games')).toBeNull();
    expect(selectOption(empty, 'best_win_rate')).toBeNull();
  });
});

describe('selectTopOptions', () => {
  const items: BuildElement = {
    games: 20,
    options: [
      { key: [1], games: 10, wins: 4 },
      { key: [2], games: 6, wins: 4 },
      { key: [3], games: 3, wins: 2 },
      { key: [4], games: 1, wins: 0 },
    ],
    best_win_rate: { key: [5], games: 1, wins: 1 },
  };
  it('最多は試合数の多い順に上位 limit 件', () => {
    expect(selectTopOptions(items, 'most_games', 2).map((o) => o.key)).toEqual([
      [1],
      [2],
    ]);
  });
  it('最高勝率は best_win_rate を含めて勝率順（同率は試合数の多い順）', () => {
    expect(selectTopOptions(items, 'best_win_rate').map((o) => o.key)).toEqual([
      [5],
      [2],
      [3],
    ]);
  });
  it('best_win_rate が options にある場合は重複させない', () => {
    const dup = { ...items, best_win_rate: items.options[1] };
    expect(selectTopOptions(dup, 'best_win_rate', 10)).toHaveLength(4);
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
