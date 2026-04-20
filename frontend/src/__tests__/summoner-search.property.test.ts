/**
 * Feature: summoner-search
 * プロパティテスト（fast-check）
 */

import * as fc from 'fast-check';
import { validateSummonerName } from '@/lib/summoner-search/validateSummonerName';

// Property 1: 空入力は検索を実行しない
// Validates: 要件 3.1
describe('Property 1: 空文字列・空白文字列はバリデーションを通過しない', () => {
  it('空文字列は false を返す', () => {
    expect(validateSummonerName('')).toBe(false);
  });

  it('空白のみの文字列は false を返す', () => {
    fc.assert(
      fc.property(fc.stringMatching(/^\s+$/), (whitespace) => {
        const result = validateSummonerName(whitespace);
        return result === false;
      }),
      { numRuns: 100 }
    );
  });
});

// Property 2: 101文字以上の入力はバリデーションエラーを返す
// Validates: 要件 3.4
describe('Property 2: 101文字以上の入力はバリデーションエラーを返す', () => {
  it('101文字以上の文字列はエラーメッセージを返す', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 101 }), (input) => {
        const result = validateSummonerName(input);
        return typeof result === 'string' && result.length > 0;
      }),
      { numRuns: 100 }
    );
  });
});

// Property 3: タグなし・タグあり両方の有効な入力はバリデーションを通過する
// Validates: 要件 3.2, 3.3
describe('Property 3: 有効な入力（タグあり・なし）はバリデーションを通過する', () => {
  it('1〜100文字の非空文字列（タグなし）は null を返す', () => {
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 1, maxLength: 100 })
          .filter((s) => s.trim() !== ''),
        (input) => {
          const result = validateSummonerName(input);
          return result === null;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('{名前}#{タグ} 形式（合計100文字以内）は null を返す', () => {
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 1, maxLength: 50 })
          .filter((s) => !s.includes('#')),
        fc
          .string({ minLength: 1, maxLength: 49 })
          .filter((s) => !s.includes('#')),
        (name, tag) => {
          const input = `${name}#${tag}`;
          if (input.length > 100) return true; // 100文字超はスキップ
          const result = validateSummonerName(input);
          return result === null;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Property 4: SuggestDropdown はクエリにマッチする候補のみ表示する
// Validates: 要件 4.2
import { filterSuggestions } from '@/lib/summoner-search/filterSuggestions';
import { MOCK_SUGGEST_CANDIDATES } from '@/lib/summoner-search/mockData';

describe('Property 4: フィルタ結果は全てクエリを名前に含む', () => {
  it('任意のクエリに対してフィルタ結果の全候補がクエリを名前に含む', () => {
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 1, maxLength: 20 })
          .filter((s) => s.trim() !== ''),
        (query) => {
          const results = filterSuggestions(
            MOCK_SUGGEST_CANDIDATES,
            query,
            'JP'
          );
          return results.every((c) =>
            c.name
              .toLowerCase()
              .includes(query.split('#')[0].trim().toLowerCase())
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('空クエリは空配列を返す', () => {
    expect(filterSuggestions(MOCK_SUGGEST_CANDIDATES, '', 'JP')).toHaveLength(
      0
    );
    expect(filterSuggestions(MOCK_SUGGEST_CANDIDATES, '  ', 'JP')).toHaveLength(
      0
    );
  });

  it('結果件数は limit 以下である', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 5 }),
        fc.integer({ min: 1, max: 10 }),
        (query, limit) => {
          const results = filterSuggestions(
            MOCK_SUGGEST_CANDIDATES,
            query,
            'JP',
            limit
          );
          return results.length <= limit;
        }
      ),
      { numRuns: 100 }
    );
  });
});
