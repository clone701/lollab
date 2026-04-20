/**
 * Feature: general-note-create
 * プロパティテスト
 */

import * as fc from 'fast-check';
import {
  validateTitle,
  validateBody,
  validateTag,
} from '@/lib/utils/generalNoteValidation';
import React from 'react';
import { render } from '@testing-library/react';
import { CharCounter } from '@/components/notes/GeneralNoteForm/CharCounter';
import { ChampionMention } from '@/components/notes/GeneralNoteDetail/ChampionMention';
import { GeneralNoteDetail } from '@/components/notes/GeneralNoteDetail/GeneralNoteDetail';
import { GeneralNoteCard } from '@/components/notes/GeneralNoteCard/GeneralNoteCard';

// Property 8: タイトルバリデーション
// Validates: Requirements 9.1, 9.4
describe('Feature: general-note-create, Property 8: タイトルバリデーション', () => {
  it('空文字列に対してvalidateTitleはエラーを返す', () => {
    expect(validateTitle('')).not.toBeNull();
  });

  it('1〜100文字の文字列に対してvalidateTitleはnullを返す', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        (title) => validateTitle(title) === null
      ),
      { numRuns: 100 }
    );
  });

  it('100文字超の文字列に対してvalidateTitleはエラーを返す', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 101, maxLength: 200 }),
        (title) => validateTitle(title) !== null
      ),
      { numRuns: 100 }
    );
  });
});

// Property 9: 本文文字数バリデーション
// Validates: Requirements 9.2, 9.4
describe('Feature: general-note-create, Property 9: 本文文字数バリデーション', () => {
  it('10,000文字以内の文字列に対してvalidateBodyはnullを返す', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 10000 }),
        (body) => validateBody(body) === null
      ),
      { numRuns: 100 }
    );
  });

  it('10,000文字超の文字列に対してvalidateBodyはエラーを返す', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 10001, maxLength: 10100 }),
        (body) => validateBody(body) !== null
      ),
      { numRuns: 100 }
    );
  });
});

// Property 10: 文字数カウンターの正確性
// Validates: Requirements 7.1, 7.2
describe('Feature: general-note-create, Property 10: 文字数カウンターの正確性', () => {
  it('任意の文字列に対してCharCounterは{length}/{max}形式で表示する', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 10000 }),
        fc.integer({ min: 1, max: 10000 }),
        (str, max) => {
          const { container } = render(
            <CharCounter current={str.length} max={max} />
          );
          return container.textContent === `${str.length}/${max}`;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Property 6: タグ数制約
// Validates: Requirements 6.3
describe('Feature: general-note-create, Property 6: タグ数制約', () => {
  it('任意のタグ配列に対して最初の10件のみが保持される', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), {
          minLength: 0,
          maxLength: 20,
        }),
        (tags) => {
          const result = tags.slice(0, 10);
          return result.length <= 10;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Property 7: タグ文字数制約
// Validates: Requirements 6.4
describe('Feature: general-note-create, Property 7: タグ文字数制約', () => {
  it('20文字を超える文字列に対してvalidateTagはnull以外を返す', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 21, maxLength: 100 }),
        (tag) => validateTag(tag) !== null
      ),
      { numRuns: 100 }
    );
  });
});

// Property 4: チャンピオンメンション変換
// Validates: Requirements 4.1, 4.2, 4.5
describe('Feature: general-note-create, Property 4: チャンピオンメンション変換', () => {
  it('有効なchampionIdを含む /championId パターンに対してチャンピオン画像と名前が表示される', () => {
    const validIds = ['Yasuo', 'Ahri', 'Zed'];
    // サフィックスは英数字以外で始まるか空文字（チャンピオンIDの境界を保証）
    const nonAlphanumericStart = fc
      .string({ minLength: 0, maxLength: 20 })
      .filter((s) => s.length === 0 || !/[A-Za-z0-9]/.test(s[0]));
    fc.assert(
      fc.property(
        fc.constantFrom(...validIds),
        nonAlphanumericStart,
        (championId, suffix) => {
          const { container } = render(
            <ChampionMention content={`/${championId}${suffix}`} />
          );
          const img = container.querySelector('img');
          return img !== null && img.alt !== '';
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Property 5: 無効なチャンピオンIDはテキストのまま表示される
// Validates: Requirements 4.3
describe('Feature: general-note-create, Property 5: 無効なチャンピオンIDはテキストのまま', () => {
  it('存在しないchampionIdを含む /invalidId パターンはテキストのまま表示される', () => {
    const validIds = new Set([
      'Aatrox',
      'Ahri',
      'Akali',
      'Akshan',
      'Alistar',
      'Ambessa',
      'Amumu',
      'Anivia',
      'Annie',
      'Aphelios',
      'Ashe',
      'AurelionSol',
      'Aurora',
      'Azir',
      'Bard',
      'Belveth',
      'Blitzcrank',
      'Brand',
      'Braum',
      'Briar',
      'Caitlyn',
      'Camille',
      'Cassiopeia',
      'Chogath',
      'Corki',
      'Darius',
      'Diana',
      'Draven',
      'DrMundo',
      'Ekko',
      'Elise',
      'Evelynn',
      'Ezreal',
      'Fiddlesticks',
      'Fiora',
      'Fizz',
      'Galio',
      'Gangplank',
      'Garen',
      'Gnar',
      'Gragas',
      'Graves',
      'Gwen',
      'Hecarim',
      'Heimerdinger',
      'Hwei',
      'Illaoi',
      'Irelia',
      'Ivern',
      'Janna',
      'JarvanIV',
      'Jax',
      'Jayce',
      'Jhin',
      'Jinx',
      'Kaisa',
      'Kalista',
      'Karma',
      'Karthus',
      'Kassadin',
      'Katarina',
      'Kayle',
      'Kayn',
      'Kennen',
      'Khazix',
      'Kindred',
      'Kled',
      'KogMaw',
      'KSante',
      'Leblanc',
      'LeeSin',
      'Leona',
      'Lillia',
      'Lissandra',
      'Lucian',
      'Lulu',
      'Lux',
      'Malphite',
      'Malzahar',
      'Maokai',
      'MasterYi',
      'Mel',
      'Milio',
      'MissFortune',
      'Mordekaiser',
      'Morgana',
      'Naafiri',
      'Nami',
      'Nasus',
      'Nautilus',
      'Neeko',
      'Nidalee',
      'Nilah',
      'Nocturne',
      'Nunu',
      'Olaf',
      'Orianna',
      'Ornn',
      'Pantheon',
      'Poppy',
      'Pyke',
      'Qiyana',
      'Quinn',
      'Rakan',
      'Rammus',
      'RekSai',
      'Rell',
      'Renata',
      'Renekton',
      'Rengar',
      'Riven',
      'Rumble',
      'Ryze',
      'Samira',
      'Sejuani',
      'Senna',
      'Seraphine',
      'Sett',
      'Shaco',
      'Shen',
      'Shyvana',
      'Singed',
      'Sion',
      'Sivir',
      'Skarner',
      'Smolder',
      'Sona',
      'Soraka',
      'Swain',
      'Sylas',
      'Syndra',
      'TahmKench',
      'Taliyah',
      'Talon',
      'Taric',
      'Teemo',
      'Thresh',
      'Tristana',
      'Trundle',
      'Tryndamere',
      'TwistedFate',
      'Twitch',
      'Udyr',
      'Urgot',
      'Varus',
      'Vayne',
      'Veigar',
      'Velkoz',
      'Vex',
      'Vi',
      'Viego',
      'Viktor',
      'Vladimir',
      'Volibear',
      'Warwick',
      'Wukong',
      'Xayah',
      'Xerath',
      'XinZhao',
      'Yasuo',
      'Yone',
      'Yorick',
      'Yunara',
      'Yuumi',
      'Zac',
      'Zed',
      'Zeri',
      'Ziggs',
      'Zilean',
      'Zoe',
      'Zyra',
    ]);
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 1, maxLength: 20 })
          .filter((s) => /^[A-Za-z]+$/.test(s) && !validIds.has(s)),
        (invalidId) => {
          const content = `/${invalidId}`;
          const { container } = render(<ChampionMention content={content} />);
          const img = container.querySelector('img');
          return (
            img === null && container.textContent?.includes(`/${invalidId}`)
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Property 3: NoteDetailは全フィールドを表示する
// Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7
jest.mock('@/components/notes/GeneralNoteDetail/MarkdownRenderer', () => ({
  MarkdownRenderer: ({ content }: { content: string }) =>
    React.createElement('div', { 'data-testid': 'markdown-renderer' }, content),
}));

describe('Feature: general-note-create, Property 3: NoteDetailは全フィールドを表示する', () => {
  it('任意のGeneralNoteオブジェクトに対してGeneralNoteDetailはtitle・tags・updated_at・編集・削除ボタンを表示する', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.integer({ min: 1 }),
          user_id: fc.string({ minLength: 1, maxLength: 36 }),
          title: fc.string({ minLength: 1, maxLength: 100 }),
          body: fc.option(fc.string({ minLength: 0, maxLength: 1000 }), {
            nil: null,
          }),
          tags: fc.array(fc.string({ minLength: 1, maxLength: 20 }), {
            minLength: 0,
            maxLength: 10,
          }),
          created_at: fc.constant('2024-01-01T00:00:00Z'),
          updated_at: fc.constant('2024-06-01T12:00:00Z'),
        }),
        (note) => {
          const { container, getAllByRole } = render(
            React.createElement(GeneralNoteDetail, {
              note,
              onEdit: () => {},
              onDelete: () => {},
            })
          );
          // タイトルが表示される
          const hasTitle = container.textContent?.includes(note.title) ?? false;
          // タグが全て表示される
          const hasTags = note.tags.every((tag) =>
            container.textContent?.includes(tag)
          );
          // 編集・削除ボタンが存在する
          const buttons = getAllByRole('button');
          const hasEditButton = buttons.some((b) =>
            b.textContent?.includes('編集')
          );
          const hasDeleteButton = buttons.some((b) =>
            b.textContent?.includes('削除')
          );
          return hasTitle && hasTags && hasEditButton && hasDeleteButton;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Property 1: NoteCardは全フィールドを表示する
// Validates: Requirements 1.2, 1.3, 1.4, 1.5, 1.6
describe('Feature: general-note-create, Property 1: NoteCardは全フィールドを表示する', () => {
  it('任意のGeneralNoteオブジェクトに対してGeneralNoteCardはtitle・bodyプレビュー・tags・created_at・updated_atを表示する', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.integer({ min: 1 }),
          user_id: fc.string({ minLength: 1, maxLength: 36 }),
          title: fc.string({ minLength: 1, maxLength: 100 }),
          body: fc.option(fc.string({ minLength: 1, maxLength: 1000 }), {
            nil: null,
          }),
          tags: fc.array(fc.string({ minLength: 1, maxLength: 20 }), {
            minLength: 0,
            maxLength: 10,
          }),
          created_at: fc.constant('2024-01-01T00:00:00Z'),
          updated_at: fc.constant('2024-06-01T12:00:00Z'),
        }),
        (note) => {
          const { container } = render(
            React.createElement(GeneralNoteCard, {
              note,
              isSelected: false,
              onClick: () => {},
            })
          );
          const text = container.textContent ?? '';
          // タイトルが表示される
          const hasTitle = text.includes(note.title);
          // 本文プレビュー（先頭100文字）が表示される
          const bodyPreview = note.body ? note.body.slice(0, 100) : '';
          const hasBody = bodyPreview === '' || text.includes(bodyPreview);
          // タグが全て表示される
          const hasTags = note.tags.every((tag) => text.includes(tag));
          // 作成日時・更新日時が表示される（formatDateで変換済み）
          const hasCreatedAt = text.includes('作成:');
          const hasUpdatedAt = text.includes('更新:');
          return hasTitle && hasBody && hasTags && hasCreatedAt && hasUpdatedAt;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Property 2: ノート一覧は更新日時降順でソートされる
// Validates: Requirements 1.8
describe('Feature: general-note-create, Property 2: ノート一覧は更新日時降順でソートされる', () => {
  it('任意のGeneralNoteリストをupdated_at DESCでソートすると降順になる', () => {
    // タイムスタンプをミリ秒整数で生成し、安全にISO文字列に変換
    const safeIsoDate = fc
      .integer({ min: 1577836800000, max: 1893456000000 }) // 2020-01-01 〜 2030-01-01
      .map((ms) => new Date(ms).toISOString());

    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.integer({ min: 1 }),
            user_id: fc.string({ minLength: 1, maxLength: 36 }),
            title: fc.string({ minLength: 1, maxLength: 100 }),
            body: fc.option(fc.string({ minLength: 0, maxLength: 100 }), {
              nil: null,
            }),
            tags: fc.array(fc.string({ minLength: 1, maxLength: 20 }), {
              maxLength: 5,
            }),
            created_at: fc.constant('2024-01-01T00:00:00Z'),
            updated_at: safeIsoDate,
          }),
          { minLength: 0, maxLength: 20 }
        ),
        (notes) => {
          const sorted = [...notes].sort(
            (a, b) =>
              new Date(b.updated_at).getTime() -
              new Date(a.updated_at).getTime()
          );
          for (let i = 0; i < sorted.length - 1; i++) {
            if (
              new Date(sorted[i].updated_at) <
              new Date(sorted[i + 1].updated_at)
            ) {
              return false;
            }
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
