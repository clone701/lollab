import { champions } from '@/lib/data/champions';
import type { PickSheet } from '@/types/myPick';
import {
  MAX_SHEET_NAME_LENGTH,
  filterEnemies,
  filterSheetsByLane,
  serializeDraft,
  toPickMap,
  toPickRows,
  validateSheetName,
} from '..';

describe('validateSheetName', () => {
  it('前後の空白を除いた名前を返す', () => {
    expect(validateSheetName('  TOP表  ')).toEqual({
      value: 'TOP表',
      error: null,
    });
  });

  it('空・空白だけはエラー', () => {
    expect(validateSheetName('').error).not.toBeNull();
    expect(validateSheetName('   ').error).not.toBeNull();
  });

  it('50文字は通り、51文字はエラー', () => {
    expect(validateSheetName('あ'.repeat(MAX_SHEET_NAME_LENGTH)).error).toBe(
      null
    );
    expect(
      validateSheetName('あ'.repeat(MAX_SHEET_NAME_LENGTH + 1)).error
    ).not.toBeNull();
  });

  it('空白を除いて50文字なら、前後の空白があっても通る', () => {
    expect(
      validateSheetName(` ${'あ'.repeat(MAX_SHEET_NAME_LENGTH)} `).error
    ).toBeNull();
  });
});

describe('filterEnemies（検索・入力済みの絞り込み）', () => {
  const picks = { Ahri: ['Zed'], Yasuo: ['Yone', 'Ahri'] };

  it('絞り込みなしなら全チャンピオン', () => {
    expect(filterEnemies(champions, picks, '', false)).toHaveLength(
      champions.length
    );
  });

  it('入力済みの行だけにできる', () => {
    const result = filterEnemies(champions, picks, '', true);
    expect(result.map((c) => c.id).sort()).toEqual(['Ahri', 'Yasuo']);
  });

  it('日本語名・読み・英語名で検索できる', () => {
    expect(filterEnemies(champions, picks, 'アーリ', false)[0].id).toBe('Ahri');
    expect(filterEnemies(champions, picks, 'あーり', false)[0].id).toBe('Ahri');
    expect(filterEnemies(champions, picks, 'ahri', false)[0].id).toBe('Ahri');
  });

  it('検索と入力済みを組み合わせられる', () => {
    expect(
      filterEnemies(champions, picks, 'ahri', true).map((c) => c.id)
    ).toEqual(['Ahri']);
    expect(filterEnemies(champions, picks, 'zed', true)).toEqual([]);
  });
});

describe('toPickMap / toPickRows', () => {
  it('空の行は含めない', () => {
    expect(
      toPickMap([
        { enemyChampionId: 'Ahri', pickChampionIds: [] },
        { enemyChampionId: 'Zed', pickChampionIds: ['Yasuo'] },
      ])
    ).toEqual({ Zed: ['Yasuo'] });
    expect(toPickRows({ Ahri: [], Zed: ['Yasuo'] })).toEqual([
      { enemyChampionId: 'Zed', pickChampionIds: ['Yasuo'] },
    ]);
  });

  it('ピックの順番を保つ', () => {
    const rows = toPickRows({ Ahri: ['Zed', 'Yasuo', 'Akali'] });
    expect(rows[0].pickChampionIds).toEqual(['Zed', 'Yasuo', 'Akali']);
  });

  it('相手と同じチャンピオン（ミラー）も残す', () => {
    expect(toPickRows({ Ahri: ['Ahri'] })[0].pickChampionIds).toEqual(['Ahri']);
  });
});

describe('serializeDraft（未保存の変更の判定）', () => {
  it('同じ内容なら同じ文字列', () => {
    expect(serializeDraft('表', 'TOP', { Ahri: ['Zed'] })).toBe(
      serializeDraft('表', 'TOP', { Ahri: ['Zed'] })
    );
  });

  it('名前・レーン・ピック・順番のどれが変わっても違う文字列', () => {
    const base = serializeDraft('表', 'TOP', { Ahri: ['Zed', 'Yasuo'] });
    expect(serializeDraft('表2', 'TOP', { Ahri: ['Zed', 'Yasuo'] })).not.toBe(
      base
    );
    expect(serializeDraft('表', 'MIDDLE', { Ahri: ['Zed', 'Yasuo'] })).not.toBe(
      base
    );
    expect(serializeDraft('表', 'TOP', { Ahri: ['Zed'] })).not.toBe(base);
    expect(serializeDraft('表', 'TOP', { Ahri: ['Yasuo', 'Zed'] })).not.toBe(
      base
    );
  });

  it('空の行の有無は違いにならない', () => {
    expect(serializeDraft('表', 'TOP', { Ahri: [] })).toBe(
      serializeDraft('表', 'TOP', {})
    );
  });
});

describe('filterSheetsByLane', () => {
  const sheet = (id: number, lane: PickSheet['lane']): PickSheet => ({
    id,
    name: `表${id}`,
    lane,
    entryCount: 0,
    createdAt: '',
    updatedAt: '',
  });
  const sheets = [sheet(1, 'TOP'), sheet(2, 'MIDDLE'), sheet(3, 'TOP')];

  it('null なら全て', () => {
    expect(filterSheetsByLane(sheets, null)).toHaveLength(3);
  });

  it('レーンで絞り込む', () => {
    expect(filterSheetsByLane(sheets, 'TOP').map((s) => s.id)).toEqual([1, 3]);
    expect(filterSheetsByLane(sheets, 'JUNGLE')).toEqual([]);
  });
});
