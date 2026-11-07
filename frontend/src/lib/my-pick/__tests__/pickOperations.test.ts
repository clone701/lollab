import fc from 'fast-check';
import { champions } from '@/lib/data/champions';
import {
  MAX_PICKS,
  addSlot,
  canAddSlot,
  getSlotCount,
  normalizePicks,
  removePickAt,
  setPickAt,
} from '..';

const ids = champions.map((c) => c.id);

describe('setPickAt（枠への追加・入れ替え）', () => {
  it('末尾の枠に追加する', () => {
    expect(setPickAt(['Ahri'], 1, 'Zed')).toEqual(['Ahri', 'Zed']);
  });

  it('空の配列には先頭に入る', () => {
    expect(setPickAt([], 0, 'Zed')).toEqual(['Zed']);
  });

  it('空きの枠を押しても、左に詰めて末尾に追加する', () => {
    expect(setPickAt(['Ahri'], 3, 'Zed')).toEqual(['Ahri', 'Zed']);
  });

  it('既にあるピックの枠は入れ替える', () => {
    expect(setPickAt(['Ahri', 'Zed'], 0, 'Yasuo')).toEqual(['Yasuo', 'Zed']);
  });

  it('同じ行に同じチャンピオンは入れられない（元の配列をそのまま返す）', () => {
    const picks = ['Ahri', 'Zed'];
    expect(setPickAt(picks, 2, 'Ahri')).toBe(picks);
    expect(setPickAt(picks, 0, 'Zed')).toBe(picks);
  });

  it('自分の枠に同じチャンピオンを選び直しても変わらない', () => {
    const picks = ['Ahri', 'Zed'];
    expect(setPickAt(picks, 1, 'Zed')).toBe(picks);
  });

  it('champions.ts にない id は入れられない', () => {
    const picks = ['Ahri'];
    expect(setPickAt(picks, 1, 'NotAChampion')).toBe(picks);
  });

  it('10個を超えては追加できない', () => {
    const full = ids.slice(0, MAX_PICKS);
    expect(setPickAt(full, MAX_PICKS, ids[MAX_PICKS])).toBe(full);
  });

  it('どんな操作を重ねても、重複なし・10個以下・順番どおりを保つ', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.tuple(fc.integer({ min: 0, max: 12 }), fc.constantFrom(...ids)),
          { maxLength: 40 }
        ),
        (operations) => {
          let picks: string[] = [];
          for (const [index, id] of operations) {
            picks = setPickAt(picks, index, id);
          }
          expect(picks.length).toBeLessThanOrEqual(MAX_PICKS);
          expect(new Set(picks).size).toBe(picks.length);
        }
      )
    );
  });
});

describe('removePickAt（外して詰める）', () => {
  it('外すと右のピックが左に詰まる', () => {
    expect(removePickAt(['Ahri', 'Zed', 'Yasuo'], 1)).toEqual([
      'Ahri',
      'Yasuo',
    ]);
  });

  it('範囲外の枠は何もしない', () => {
    const picks = ['Ahri'];
    expect(removePickAt(picks, 3)).toBe(picks);
    expect(removePickAt(picks, -1)).toBe(picks);
  });
});

describe('枠の数', () => {
  it('ピックが少なくても初期は3つ', () => {
    expect(getSlotCount(0)).toBe(3);
    expect(getSlotCount(2)).toBe(3);
  });

  it('ピック数が3を超えたら、その数', () => {
    expect(getSlotCount(7)).toBe(7);
  });

  it('「＋」で増やした数を保つ。上限は10', () => {
    expect(getSlotCount(2, 7)).toBe(7);
    expect(getSlotCount(2, 99)).toBe(10);
  });

  it('「＋」は1つずつ増やし、10に達したら押せない', () => {
    expect(addSlot(5)).toBe(6);
    expect(addSlot(10)).toBe(10);
    expect(canAddSlot(9)).toBe(true);
    expect(canAddSlot(10)).toBe(false);
  });
});

describe('normalizePicks', () => {
  it('重複と不明な id を除き、順番を保つ', () => {
    expect(normalizePicks(['Zed', 'Ahri', 'Zed', 'X', 'Yasuo'])).toEqual([
      'Zed',
      'Ahri',
      'Yasuo',
    ]);
  });

  it('先頭から10個までにする', () => {
    expect(normalizePicks(ids.slice(0, 15))).toEqual(ids.slice(0, MAX_PICKS));
  });
});
