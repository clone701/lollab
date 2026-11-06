import {
  calcBarRatio,
  calcDamageMax,
  calcShare,
  formatCsPerMinute,
  formatKdaLine,
  formatKdaRatio,
  formatRank,
  getDisplayName,
} from '..';
import { makeMatchDetail, makeParticipant } from '../__fixtures__/matchDetail';

describe('formatKdaLine', () => {
  it('キル/デス/アシストとキル関与率を `0/10/2 (20%)` の形にする', () => {
    const p = makeParticipant({
      kills: 0,
      deaths: 10,
      assists: 2,
      kill_participation: 0.2,
    });
    expect(formatKdaLine(p)).toBe('0/10/2 (20%)');
  });

  it('キル関与率は四捨五入した整数の%にする', () => {
    expect(
      formatKdaLine(makeParticipant({ kill_participation: 0.666 }))
    ).toContain('(67%)');
    expect(formatKdaLine(makeParticipant({ kill_participation: 0 }))).toContain(
      '(0%)'
    );
    expect(formatKdaLine(makeParticipant({ kill_participation: 1 }))).toContain(
      '(100%)'
    );
  });
});

describe('formatKdaRatio', () => {
  it('(キル + アシスト) / デス を小数2桁で出す', () => {
    expect(formatKdaRatio(5, 2, 3)).toBe('4.00:1');
    expect(formatKdaRatio(1, 3, 1)).toBe('0.67:1');
  });

  it('デスが0なら Perfect', () => {
    expect(formatKdaRatio(5, 0, 3)).toBe('Perfect');
    expect(formatKdaRatio(0, 0, 0)).toBe('Perfect');
  });
});

describe('formatCsPerMinute', () => {
  it('分あたりの CS を小数1桁で出す', () => {
    expect(formatCsPerMinute(180, 1800)).toBe('6.0');
    expect(formatCsPerMinute(100, 1500)).toBe('4.0');
  });

  it('試合時間が0なら 0.0', () => {
    expect(formatCsPerMinute(10, 0)).toBe('0.0');
  });
});

describe('ダメージの割合', () => {
  it('試合内の最大値を求める', () => {
    const max = calcDamageMax(makeMatchDetail().participants);
    expect(max).toEqual({ dealt: 100000, taken: 50000 });
  });

  it('最大値に対する割合を 0〜1 で返す', () => {
    expect(calcBarRatio(50, 100)).toBe(0.5);
    expect(calcBarRatio(100, 100)).toBe(1);
    expect(calcBarRatio(0, 100)).toBe(0);
  });

  it('最大値が0なら 0、範囲外は丸める', () => {
    expect(calcBarRatio(0, 0)).toBe(0);
    expect(calcBarRatio(150, 100)).toBe(1);
    expect(calcBarRatio(-1, 100)).toBe(0);
  });
});

describe('calcShare', () => {
  it('a の割合を返し、両方0なら 0.5', () => {
    expect(calcShare(30, 10)).toBe(0.75);
    expect(calcShare(0, 0)).toBe(0.5);
    expect(calcShare(0, 5)).toBe(0);
  });
});

describe('formatRank', () => {
  it('ディビジョンがあれば数字で付ける', () => {
    expect(formatRank({ tier: 'EMERALD', division: 'I' })).toBe('エメラルド 1');
    expect(formatRank({ tier: 'IRON', division: 'IV' })).toBe('アイアン 4');
  });

  it('マスター以上はディビジョンを付けない', () => {
    expect(formatRank({ tier: 'MASTER', division: null })).toBe('マスター');
    expect(formatRank({ tier: 'MASTER', division: 'I' })).toBe('マスター');
    expect(formatRank({ tier: 'GRANDMASTER', division: null })).toBe(
      'グランドマスター'
    );
  });

  it('未知のティアはそのまま出す', () => {
    expect(formatRank({ tier: 'UNKNOWN', division: null })).toBe('UNKNOWN');
  });
});

describe('getDisplayName', () => {
  it('名前がなければ「名前なし」', () => {
    expect(getDisplayName({ riot_id_game_name: 'A' })).toBe('A');
    expect(getDisplayName({ riot_id_game_name: null })).toBe('名前なし');
    expect(getDisplayName({ riot_id_game_name: '' })).toBe('名前なし');
  });
});
