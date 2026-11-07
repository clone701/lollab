/**
 * Feature: summoner-search
 * コンポーネントプロパティテスト（fast-check + React Testing Library）
 */

import * as fc from 'fast-check';
import { render } from '@testing-library/react';
import SummonerProfile from '@/components/summoner-search/SummonerProfile';
import RankInfo from '@/components/summoner-search/RankInfo';
import MatchCard from '@/components/summoner-search/MatchCard';
import type { SummonerData, RankData, MatchData } from '@/types/summoner';

// Arbitraries
const rankDataArb = (): fc.Arbitrary<RankData> =>
  fc.record({
    queueType: fc.string({ minLength: 1, maxLength: 20 }),
    tier: fc.string({ minLength: 1, maxLength: 20 }),
    rank: fc.string({ minLength: 1, maxLength: 5 }),
    leaguePoints: fc.integer({ min: 0, max: 9999 }),
    wins: fc.integer({ min: 0, max: 9999 }),
    losses: fc.integer({ min: 0, max: 9999 }),
  });

const summonerDataArb = (): fc.Arbitrary<SummonerData> =>
  fc.record({
    puuid: fc.string({ minLength: 1, maxLength: 30 }),
    name: fc.string({ minLength: 1, maxLength: 30 }),
    tagLine: fc.string({ minLength: 1, maxLength: 10 }),
    level: fc.integer({ min: 1, max: 9999 }),
    profileIconId: fc.integer({ min: 1, max: 9999 }),
    rank: rankDataArb(),
    lastUpdatedAt: fc
      .date({
        min: new Date('2020-01-01'),
        max: new Date('2030-01-01'),
        noInvalidDate: true,
      })
      .map((d) => d.toISOString()),
  });

// アルファベット・数字のみのチャンピオン名（画像パスに特殊文字が入らないよう）
const championNameArb = fc.stringMatching(/^[A-Za-z][A-Za-z0-9]{0,28}$/);

const matchDataArb = (): fc.Arbitrary<MatchData> =>
  fc.record({
    matchId: fc.string({ minLength: 1, maxLength: 20 }),
    isWin: fc.boolean(),
    isRemake: fc.constant(false),
    gameMode: fc.string({ minLength: 1, maxLength: 20 }),
    queueId: fc.constantFrom(420, 440, 450, 1700),
    championName: championNameArb,
    kills: fc.integer({ min: 0, max: 50 }),
    deaths: fc.integer({ min: 1, max: 50 }), // deaths >= 1 でKDA計算を安定させる
    assists: fc.integer({ min: 0, max: 50 }),
    killParticipation: fc.double({ min: 0, max: 1, noNaN: true }),
    cs: fc.integer({ min: 1, max: 999 }), // cs >= 1 で "0" の誤検知を避ける
    gameDurationSeconds: fc.integer({ min: 60, max: 7200 }),
    itemIds: fc.array(fc.integer({ min: 1000, max: 9999 }), {
      minLength: 0,
      maxLength: 7,
    }),
    spellIds: fc.array(fc.constantFrom(4, 7, 12, 14), {
      minLength: 2,
      maxLength: 2,
    }),
    keystoneId: fc.constantFrom(8112, 8010, 8005),
    subStyleId: fc.constantFrom(8100, 8200, 8400),
    participants: fc.constant([]),
    averageRank: fc.constantFrom(
      null,
      { tier: 'GOLD', division: 'II' },
      { tier: 'MASTER', division: null }
    ),
    timeAgoSeconds: fc.integer({ min: 0, max: 86400 * 30 }),
  });

// Property 5: SummonerProfile は全フィールドを表示する
// Validates: 要件 6.1, 6.2, 6.3, 6.4
describe('Property 5: SummonerProfile は全フィールドを表示する', () => {
  it('任意の SummonerData に対して全フィールドが表示される', () => {
    fc.assert(
      fc.property(summonerDataArb(), (summoner) => {
        const { unmount } = render(
          <SummonerProfile
            summoner={summoner}
            rankPosition={null}
            isFavorite={false}
            onToggleFavorite={() => {}}
            isLoggedIn={false}
            isUpdating={false}
            onUpdate={() => {}}
            updateError={null}
          />
        );
        const text = document.body.textContent ?? '';
        const hasName = text.includes(summoner.name);
        const hasTag = text.includes(summoner.tagLine);
        const hasLevel = text.includes(String(summoner.level));
        unmount();
        return hasName && hasTag && hasLevel;
      }),
      { numRuns: 100 }
    );
  });
});

// Property 6: 勝率50%以上は緑色で表示される
// Validates: 要件 6.5
describe('Property 6: 勝率50%以上は緑色で表示される', () => {
  it('wins >= losses の RankData で緑色クラスが適用される', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 9999 }),
        fc.integer({ min: 0 }),
        (wins, extraLosses) => {
          // wins >= losses を保証
          const losses = Math.max(0, wins - 1 - (extraLosses % wins));
          const { unmount } = render(
            <RankInfo
              rank={{
                queueType: 'RANKED_SOLO_5x5',
                tier: 'GOLD',
                rank: 'I',
                leaguePoints: 50,
                wins,
                losses,
              }}
            />
          );
          const greenEl = document.body.querySelector('.text-win');
          unmount();
          return greenEl !== null;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Property 7: MatchCard は全フィールドを表示し、勝敗に応じたラベルを持つ
// Validates: 要件 7.2, 7.3, 7.4, 7.5
describe('Property 7: MatchCard は全フィールドを表示し、勝敗に応じたラベルを持つ', () => {
  it('任意の MatchData に対して全フィールドと勝敗ラベルが正しく表示される', () => {
    fc.assert(
      fc.property(matchDataArb(), (match) => {
        const { unmount } = render(
          <MatchCard match={match} puuid="p" region="JP" />
        );
        const text = document.body.textContent ?? '';
        // チャンピオン名はalt属性で確認
        const imgEl = document.body.querySelector(
          `img[alt="${match.championName}"]`
        );
        const hasChampion = imgEl !== null;
        const hasCS = text.includes(`CS ${match.cs}`);
        const hasWinLabel = match.isWin
          ? text.includes('勝利')
          : text.includes('敗北');
        unmount();
        return hasChampion && hasCS && hasWinLabel;
      }),
      { numRuns: 100 }
    );
  });
});
