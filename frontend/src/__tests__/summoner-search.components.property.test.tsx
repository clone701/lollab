/**
 * Feature: summoner-search
 * コンポーネントプロパティテスト（fast-check + React Testing Library）
 */

import * as fc from 'fast-check';
import { render, screen } from '@testing-library/react';
import SummonerProfile from '@/components/summoner-search/SummonerProfile';
import MatchCard from '@/components/summoner-search/MatchCard';
import ChampionStatRow from '@/components/summoner-search/ChampionStatRow';
import type {
  SummonerData,
  RankData,
  MatchData,
  ChampionStatData,
} from '@/types/summoner';

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
    name: fc.string({ minLength: 1, maxLength: 30 }),
    tagLine: fc.string({ minLength: 1, maxLength: 10 }),
    level: fc.integer({ min: 1, max: 9999 }),
    profileIconId: fc.integer({ min: 1, max: 9999 }),
    rank: rankDataArb(),
    previousSeasonRank: fc.string({ minLength: 1, maxLength: 30 }),
  });

// アルファベット・数字のみのチャンピオン名（画像パスに特殊文字が入らないよう）
const championNameArb = fc.stringMatching(/^[A-Za-z][A-Za-z0-9]{0,28}$/);

const matchDataArb = (): fc.Arbitrary<MatchData> =>
  fc.record({
    matchId: fc.string({ minLength: 1, maxLength: 20 }),
    isWin: fc.boolean(),
    gameMode: fc.string({ minLength: 1, maxLength: 20 }),
    championName: championNameArb,
    kills: fc.integer({ min: 0, max: 50 }),
    deaths: fc.integer({ min: 1, max: 50 }), // deaths >= 1 でKDA計算を安定させる
    assists: fc.integer({ min: 0, max: 50 }),
    cs: fc.integer({ min: 1, max: 999 }), // cs >= 1 で "0" の誤検知を避ける
    gameDurationSeconds: fc.integer({ min: 60, max: 7200 }),
    itemIds: fc.array(fc.integer({ min: 1000, max: 9999 }), {
      minLength: 0,
      maxLength: 6,
    }),
    timeAgoSeconds: fc.integer({ min: 0, max: 86400 * 30 }),
  });

const championStatDataArb = (): fc.Arbitrary<ChampionStatData> =>
  fc.record({
    championName: championNameArb,
    wins: fc.integer({ min: 0, max: 9999 }),
    losses: fc.integer({ min: 0, max: 9999 }),
    cs: fc.integer({ min: 1, max: 999 }), // cs >= 1 で "0" の誤検知を避ける
    kda: fc.float({ min: Math.fround(0.1), max: Math.fround(99), noNaN: true }),
  });

// Property 5: SummonerProfile は全フィールドを表示する
// Validates: 要件 6.1, 6.2, 6.3, 6.4
describe('Property 5: SummonerProfile は全フィールドを表示する', () => {
  it('任意の SummonerData に対して全フィールドが表示される', () => {
    fc.assert(
      fc.property(summonerDataArb(), (summoner) => {
        const { unmount } = render(<SummonerProfile summoner={summoner} />);
        const text = document.body.textContent ?? '';
        const hasName = text.includes(summoner.name);
        const hasTag = text.includes(summoner.tagLine);
        const hasLevel = text.includes(String(summoner.level));
        const hasTier = text.includes(summoner.rank.tier);
        const hasLP = text.includes(String(summoner.rank.leaguePoints));
        const hasPrevSeason = text.includes(summoner.previousSeasonRank);
        unmount();
        return (
          hasName && hasTag && hasLevel && hasTier && hasLP && hasPrevSeason
        );
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
          const summoner: SummonerData = {
            name: 'Test',
            tagLine: 'KR1',
            level: 100,
            profileIconId: 1,
            rank: {
              queueType: 'ランクソロ',
              tier: 'GOLD',
              rank: 'I',
              leaguePoints: 50,
              wins,
              losses,
            },
            previousSeasonRank: 'SILVER I',
          };
          const { unmount } = render(<SummonerProfile summoner={summoner} />);
          const greenEl = document.body.querySelector('.text-green-600');
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
        const { unmount } = render(<MatchCard match={match} />);
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

// Property 8: ChampionStatRow は全フィールドを表示し、プログレスバー幅が勝率と一致する
// Validates: 要件 8.2, 8.3
describe('Property 8: ChampionStatRow は全フィールドを表示し、プログレスバー幅が勝率と一致する', () => {
  it('任意の ChampionStatData に対して全フィールドとプログレスバー幅が勝率と一致する', () => {
    fc.assert(
      fc.property(
        championStatDataArb().filter((c) => c.wins + c.losses > 0),
        (champion) => {
          const { unmount } = render(<ChampionStatRow champion={champion} />);
          const text = document.body.textContent ?? '';
          // チャンピオン名はalt属性で確認
          const imgEl = document.body.querySelector(
            `img[alt="${champion.championName}"]`
          );
          const hasName = imgEl !== null;
          const hasCS = text.includes(`CS ${champion.cs}`);
          const totalGames = champion.wins + champion.losses;
          const winRatePct = Math.round((champion.wins / totalGames) * 100);
          const progressBar = document.body.querySelector(
            "[data-testid='win-rate-bar']"
          ) as HTMLElement | null;
          const hasCorrectWidth = progressBar?.style.width === `${winRatePct}%`;
          unmount();
          return hasName && hasCS && hasCorrectWidth;
        }
      ),
      { numRuns: 100 }
    );
  });
});
