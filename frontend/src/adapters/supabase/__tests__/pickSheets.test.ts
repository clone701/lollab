import {
  createPickSheet,
  deletePickSheet,
  getPickSheet,
  getPickSheets,
  savePickSheet,
} from '../pickSheets';
import { createClient } from '@/lib/supabase/client';

jest.mock('@/lib/supabase/client', () => ({ createClient: jest.fn() }));

interface Result {
  data?: unknown;
  error?: unknown;
}

interface Call {
  table: string;
  method: string;
  args: unknown[];
}

const OK: Result = { data: null, error: null };

// 呼ばれた順にメソッドを記録し、「テーブル.操作」ごとに決めた結果を返す Supabase クライアントのモック
function mockSupabase(results: Record<string, Result> = {}) {
  const calls: Call[] = [];
  const from = (table: string) => {
    let op = '';
    const chain: Record<string, unknown> = {};
    const settle = (): Result => results[`${table}.${op || 'select'}`] ?? OK;
    for (const method of [
      'select',
      'insert',
      'update',
      'delete',
      'eq',
      'order',
    ]) {
      chain[method] = jest.fn((...args: unknown[]) => {
        calls.push({ table, method, args });
        if (method !== 'select' && method !== 'eq' && method !== 'order') {
          op = method;
        }
        return chain;
      });
    }
    chain.single = jest.fn(async () => settle());
    chain.maybeSingle = jest.fn(async () => settle());
    chain.then = (resolve: (value: Result) => unknown) => resolve(settle());
    return chain;
  };
  (createClient as jest.Mock).mockReturnValue({ from });
  return calls;
}

const find = (calls: Call[], table: string, method: string): Call | undefined =>
  calls.find((c) => c.table === table && c.method === method);

describe('getPickSheets', () => {
  it('更新日時の新しい順に取得し、入力済みの数を entryCount にする', async () => {
    const calls = mockSupabase({
      'pick_sheets.select': {
        data: [
          {
            id: 2,
            name: 'MID表',
            lane: 'MIDDLE',
            created_at: 'c',
            updated_at: 'u',
            pick_sheet_entries: [{ count: 7 }],
          },
        ],
      },
    });
    const sheets = await getPickSheets();
    expect(find(calls, 'pick_sheets', 'order')?.args).toEqual([
      'updated_at',
      { ascending: false },
    ]);
    expect(String(find(calls, 'pick_sheets', 'select')?.args[0])).toContain(
      'pick_sheet_entries(count)'
    );
    expect(sheets).toEqual([
      {
        id: 2,
        name: 'MID表',
        lane: 'MIDDLE',
        entryCount: 7,
        createdAt: 'c',
        updatedAt: 'u',
      },
    ]);
  });

  it('取得に失敗したら例外を投げる', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockSupabase({ 'pick_sheets.select': { error: { message: 'x' } } });
    await expect(getPickSheets()).rejects.toThrow();
  });
});

describe('getPickSheet', () => {
  it('表とピックを取得して画面用の形にする', async () => {
    mockSupabase({
      'pick_sheets.select': {
        data: {
          id: 1,
          name: 'TOP表',
          lane: 'TOP',
          created_at: 'c',
          updated_at: 'u',
          pick_sheet_entries: [
            { enemy_champion_id: 'Ahri', pick_champion_ids: ['Zed', 'Yasuo'] },
          ],
        },
      },
    });
    const sheet = await getPickSheet(1);
    expect(sheet?.entryCount).toBe(1);
    expect(sheet?.rows).toEqual([
      { enemyChampionId: 'Ahri', pickChampionIds: ['Zed', 'Yasuo'] },
    ]);
  });

  it('見つからなければ null', async () => {
    mockSupabase({ 'pick_sheets.select': { data: null } });
    await expect(getPickSheet(999)).resolves.toBeNull();
  });
});

describe('createPickSheet', () => {
  it('名前の空白を除いて作る。user_id は送らない（DB の既定値に任せる）', async () => {
    const calls = mockSupabase({
      'pick_sheets.insert': {
        data: {
          id: 5,
          name: 'TOP表',
          lane: 'TOP',
          created_at: 'c',
          updated_at: 'u',
        },
      },
    });
    const sheet = await createPickSheet('  TOP表 ', 'TOP');
    expect(find(calls, 'pick_sheets', 'insert')?.args[0]).toEqual({
      name: 'TOP表',
      lane: 'TOP',
    });
    expect(sheet).toMatchObject({ id: 5, entryCount: 0 });
  });

  it('不正な名前・レーンは DB に送らず例外', async () => {
    const calls = mockSupabase();
    await expect(createPickSheet('   ', 'TOP')).rejects.toThrow();
    await expect(createPickSheet('a'.repeat(51), 'TOP')).rejects.toThrow();
    await expect(
      createPickSheet('表', 'MID' as unknown as 'TOP')
    ).rejects.toThrow();
    expect(calls).toHaveLength(0);
  });
});

describe('savePickSheet', () => {
  const updated: Result = { data: [{ id: 1 }] };

  it('表を更新 → ピックを全件削除 → 空でない行を入れ直す（順番どおり）', async () => {
    const calls = mockSupabase({ 'pick_sheets.update': updated });
    await savePickSheet(1, ' 表 ', 'MIDDLE', [
      { enemyChampionId: 'Ahri', pickChampionIds: ['Zed', 'Yasuo', 'Akali'] },
      { enemyChampionId: 'Zed', pickChampionIds: [] },
    ]);
    const order = calls
      .filter((c) => ['update', 'delete', 'insert'].includes(c.method))
      .map((c) => `${c.table}.${c.method}`);
    expect(order).toEqual([
      'pick_sheets.update',
      'pick_sheet_entries.delete',
      'pick_sheet_entries.insert',
    ]);
    expect(find(calls, 'pick_sheets', 'update')?.args[0]).toEqual({
      name: '表',
      lane: 'MIDDLE',
    });
    expect(find(calls, 'pick_sheet_entries', 'delete')).toBeDefined();
    expect(find(calls, 'pick_sheet_entries', 'insert')?.args[0]).toEqual([
      {
        sheet_id: 1,
        enemy_champion_id: 'Ahri',
        pick_champion_ids: ['Zed', 'Yasuo', 'Akali'],
      },
    ]);
  });

  it('保存する前に、重複と不明な id を除く', async () => {
    const calls = mockSupabase({ 'pick_sheets.update': updated });
    await savePickSheet(1, '表', 'TOP', [
      { enemyChampionId: 'Ahri', pickChampionIds: ['Zed', 'Zed', 'X'] },
      { enemyChampionId: 'NotAChampion', pickChampionIds: ['Zed'] },
    ]);
    expect(find(calls, 'pick_sheet_entries', 'insert')?.args[0]).toEqual([
      { sheet_id: 1, enemy_champion_id: 'Ahri', pick_champion_ids: ['Zed'] },
    ]);
  });

  it('全ての行が空なら、削除だけして insert は呼ばない', async () => {
    const calls = mockSupabase({ 'pick_sheets.update': updated });
    await savePickSheet(1, '表', 'TOP', []);
    expect(find(calls, 'pick_sheet_entries', 'delete')).toBeDefined();
    expect(find(calls, 'pick_sheet_entries', 'insert')).toBeUndefined();
  });

  it('不正な名前は DB に送らず例外', async () => {
    const calls = mockSupabase();
    await expect(savePickSheet(1, '', 'TOP', [])).rejects.toThrow();
    expect(calls).toHaveLength(0);
  });

  it('表の更新に失敗したら、ピックを削除せずに例外', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const calls = mockSupabase({
      'pick_sheets.update': { error: { message: 'x' } },
    });
    await expect(savePickSheet(1, '表', 'TOP', [])).rejects.toThrow();
    expect(find(calls, 'pick_sheet_entries', 'delete')).toBeUndefined();
  });

  it('表が見つからない（更新が0件）ときも、ピックを削除せずに例外', async () => {
    const calls = mockSupabase({ 'pick_sheets.update': { data: [] } });
    await expect(savePickSheet(1, '表', 'TOP', [])).rejects.toThrow();
    expect(find(calls, 'pick_sheet_entries', 'delete')).toBeUndefined();
  });

  it('ピックの入れ直しに失敗したら例外（画面側で再保存できる）', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockSupabase({
      'pick_sheets.update': updated,
      'pick_sheet_entries.insert': { error: { message: 'x' } },
    });
    await expect(
      savePickSheet(1, '表', 'TOP', [
        { enemyChampionId: 'Ahri', pickChampionIds: ['Zed'] },
      ])
    ).rejects.toThrow('保存に失敗しました');
  });
});

describe('deletePickSheet', () => {
  it('id を指定して表を削除する', async () => {
    const calls = mockSupabase();
    await deletePickSheet(3);
    expect(find(calls, 'pick_sheets', 'delete')).toBeDefined();
    expect(find(calls, 'pick_sheets', 'eq')?.args).toEqual(['id', 3]);
  });

  it('失敗したら例外', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockSupabase({ 'pick_sheets.delete': { error: { message: 'x' } } });
    await expect(deletePickSheet(3)).rejects.toThrow();
  });
});
