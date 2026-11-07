import type { ChampionStatData } from '@/types/summoner';
import {
  CHAMPION_STATS_TABS,
  INITIAL_VISIBLE_COUNT,
  formatCs,
  formatGames,
  formatKda,
  formatKdaBreakdown,
  formatStatsTitle,
  formatWinRate,
  getChampionLabel,
  getKdaClass,
  getVisibleChampions,
  getWinRateClass,
} from '..';

describe('getKdaClass', () => {
  it.each([
    [5, 'text-highlight'],
    [12.5, 'text-highlight'],
    [4.99, 'text-accent'],
    [4, 'text-accent'],
    [3.99, 'text-win'],
    [3, 'text-win'],
    [2.99, 'text-fg-muted'],
    [0, 'text-fg-muted'],
  ])('KDA %s は %s', (kda, expected) => {
    expect(getKdaClass(kda)).toBe(expected);
  });

  it('表示（小数第2位）で 5.00 になる値は強調色にする', () => {
    expect(getKdaClass(4.996)).toBe('text-highlight');
    expect(getKdaClass(4.994)).toBe('text-accent');
  });
});

describe('getWinRateClass', () => {
  it('60% 以上は強調、50% 以上は勝利の色、未満は敗北の色', () => {
    expect(getWinRateClass(6, 4)).toBe('font-bold text-highlight');
    expect(getWinRateClass(3, 0)).toBe('font-bold text-highlight');
    expect(getWinRateClass(59, 41)).toBe('text-win');
    expect(getWinRateClass(5, 5)).toBe('text-win');
    expect(getWinRateClass(49, 51)).toBe('text-loss');
    expect(getWinRateClass(0, 3)).toBe('text-loss');
  });
});

describe('表示用の文字列', () => {
  it('KDA は小数第2位までの比率', () => {
    expect(formatKda(2.7112)).toBe('2.71:1 KDA');
    expect(formatKda(5)).toBe('5.00:1 KDA');
  });

  it('CS は平均を整数に丸め、かっこ内に分あたりを小数1桁で出す', () => {
    expect(formatCs(198.4, 6.94)).toBe('CS 198 (6.9)');
    expect(formatCs(198.5, 7)).toBe('CS 199 (7.0)');
    expect(formatCs(0, 0)).toBe('CS 0 (0.0)');
  });

  it('平均のキル / デス / アシストは小数1桁', () => {
    expect(formatKdaBreakdown(6.44, 4.8, 6.66)).toBe('6.4 / 4.8 / 6.7');
    expect(formatKdaBreakdown(0, 0, 3)).toBe('0.0 / 0.0 / 3.0');
  });

  it('見出しは年があれば S{年} 付き、なければ年なし', () => {
    expect(formatStatsTitle(2026)).toBe('S2026 使用チャンピオン');
    expect(formatStatsTitle(null)).toBe('使用チャンピオン');
  });

  it('勝率は四捨五入した整数', () => {
    expect(formatWinRate(52, 38)).toBe('58 %');
    expect(formatWinRate(1, 2)).toBe('33 %');
    expect(formatWinRate(0, 0)).toBe('0 %');
  });

  it('試合数は勝ち + 負け', () => {
    expect(formatGames(52, 40)).toBe('92 試合');
  });
});

describe('getChampionLabel', () => {
  it('日本語名を返す。Riot の名前が異なるチャンピオンも引ける', () => {
    expect(getChampionLabel('Ahri')).toBe('アーリ');
    expect(getChampionLabel('MonkeyKing')).toBe('ウーコン');
  });

  it('見つからなければ championName をそのまま返す', () => {
    expect(getChampionLabel('Unknown')).toBe('Unknown');
  });
});

describe('getVisibleChampions', () => {
  const champions: ChampionStatData[] = Array.from({ length: 8 }, (_, i) => ({
    championName: `Champ${i}`,
    wins: 1,
    losses: 0,
    cs: 100,
    csPerMinute: 6,
    kills: 5,
    deaths: 3,
    assists: 6,
    kda: 3,
  }));

  it('展開前は先頭の6件、展開後は全件', () => {
    expect(INITIAL_VISIBLE_COUNT).toBe(6);
    expect(getVisibleChampions(champions, false)).toHaveLength(6);
    expect(getVisibleChampions(champions, true)).toHaveLength(8);
  });

  it('6件以下ならそのまま', () => {
    expect(getVisibleChampions(champions.slice(0, 3), false)).toHaveLength(3);
  });
});

describe('CHAMPION_STATS_TABS', () => {
  it('全体・ソロランク・フレックスの順', () => {
    expect(CHAMPION_STATS_TABS.map((t) => [t.id, t.label])).toEqual([
      ['all', '全体'],
      ['solo', 'ソロランク'],
      ['flex', 'フレックス'],
    ]);
  });
});
