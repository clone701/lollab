import { createNote, updateNote } from '../notes';
import { createClient } from '@/lib/supabase/client';
import type { RuneConfig } from '@/types/note';

jest.mock('@/lib/supabase/client', () => ({ createClient: jest.fn() }));

const runes: RuneConfig = {
  primaryPath: 8100,
  secondaryPath: 8400,
  keystone: 8112,
  primaryRunes: [8126, 8137, 8135],
  secondaryRunes: [8429, 8451],
  shards: [5008, 5008, 5011],
};

// insert / update に渡されたペイロードを記録する Supabase クライアントのモック
function mockSupabase() {
  const payloads: { insert?: unknown; update?: unknown } = {};
  const single = jest.fn().mockResolvedValue({ data: { id: 1 }, error: null });
  const chain: Record<string, jest.Mock> = {};
  chain.select = jest.fn(() => chain);
  chain.eq = jest.fn(() => chain);
  chain.single = single;
  chain.insert = jest.fn((p: unknown) => {
    payloads.insert = p;
    return chain;
  });
  chain.update = jest.fn((p: unknown) => {
    payloads.update = p;
    return chain;
  });
  (createClient as jest.Mock).mockReturnValue({
    auth: { getUser: async () => ({ data: { user: { id: 'user-1' } } }) },
    from: () => chain,
  });
  return payloads;
}

describe('ノート保存時の runes_id_version', () => {
  it('createNote は runes_id_version: 2 を送る', async () => {
    const payloads = mockSupabase();
    await createNote({
      my_champion_id: 'Ahri',
      enemy_champion_id: 'Zed',
      preset_name: 'テスト',
      runes,
      spells: null,
      items: null,
      memo: null,
    });
    expect(payloads.insert).toMatchObject({
      user_id: 'user-1',
      runes_id_version: 2,
    });
  });

  it('updateNote は runes が null でも runes_id_version: 2 を送る', async () => {
    const payloads = mockSupabase();
    await updateNote('1', 'user-1', {
      preset_name: 'テスト',
      runes: null,
      spells: null,
      items: null,
      memo: null,
    });
    expect(payloads.update).toMatchObject({ runes_id_version: 2 });
  });
});
