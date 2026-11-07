import { MOCK_PARTICIPANTS } from '@/lib/summoner-search';
import {
  buildMemberHref,
  formatCsLabel,
  formatKdaLabel,
  formatKillParticipation,
  getMemberName,
  getQueueName,
  splitMatchTeams,
} from '..';

describe('getQueueName', () => {
  it('ソロ/デュオとフレックスは日本語の表示名にする', () => {
    expect(getQueueName(420, 'CLASSIC')).toBe('ランク (ソロ/デュオ)');
    expect(getQueueName(440, 'CLASSIC')).toBe('ランク (フレックス)');
  });

  it('それ以外のキューは gameMode をそのまま使う', () => {
    expect(getQueueName(450, 'ARAM')).toBe('ARAM');
  });
});

describe('formatKdaLabel', () => {
  it('(キル+アシスト)/デス を小数2桁で表示する', () => {
    expect(formatKdaLabel(6, 3, 7)).toBe('4.33:1 KDA');
  });

  it('デスが0なら Perfect', () => {
    expect(formatKdaLabel(6, 0, 7)).toBe('Perfect');
  });
});

describe('formatKillParticipation', () => {
  it('整数%に四捨五入する', () => {
    expect(formatKillParticipation(0.81)).toBe('キル関与 81%');
    expect(formatKillParticipation(0.605)).toBe('キル関与 61%');
    expect(formatKillParticipation(0)).toBe('キル関与 0%');
  });
});

describe('formatCsLabel', () => {
  it('CS と分あたりの CS（小数1桁）を表示する', () => {
    expect(formatCsLabel(157, 1320)).toBe('CS 157 (7.1)');
  });

  it('試合時間が0秒なら 0.0', () => {
    expect(formatCsLabel(0, 0)).toBe('CS 0 (0.0)');
  });
});

describe('splitMatchTeams', () => {
  it('ブルー（100）とレッド（200）に5人ずつ分け、並びを保つ', () => {
    const { blue, red } = splitMatchTeams(MOCK_PARTICIPANTS);
    expect(blue.map((p) => p.puuid)).toEqual(
      ['1', '2', '3', '4', '5'].map((n) => `puuid-${n}`)
    );
    expect(red).toHaveLength(5);
    expect(red.every((p) => p.teamId === 200)).toBe(true);
  });
});

describe('buildMemberHref・getMemberName', () => {
  const named = { riotIdGameName: 'Faker', riotIdTagline: 'KR1' };
  const unnamed = { riotIdGameName: null, riotIdTagline: null };

  it('検索中の region と gameName#tagLine のリンクにする', () => {
    expect(buildMemberHref(named, 'JP')).toBe('/?region=JP&q=Faker%23KR1');
  });

  it('名前がなければリンクにしない', () => {
    expect(buildMemberHref(unnamed, 'JP')).toBeNull();
    expect(
      buildMemberHref({ riotIdGameName: null, riotIdTagline: 'KR1' }, 'JP')
    ).toBeNull();
  });

  it('表示名は名前、title は 名前#タグ。名前がなければ「名前なし」', () => {
    expect(getMemberName(named)).toEqual({
      name: 'Faker',
      fullName: 'Faker#KR1',
    });
    expect(getMemberName(unnamed)).toEqual({
      name: '名前なし',
      fullName: '名前なし',
    });
  });
});
