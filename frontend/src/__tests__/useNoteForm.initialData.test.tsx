import { act, renderHook } from '@testing-library/react';
import { useNoteForm } from '@/components/notes/NoteForm/useNoteForm';
import type { ChampionNote } from '@/types/note';

jest.mock('@/lib/contexts/AuthContext', () => ({
  useAuth: () => ({ user: null }),
}));
jest.mock('@/adapters/supabase', () => ({
  createNote: jest.fn(),
  updateNote: jest.fn(),
}));

function makeNote(overrides: Partial<ChampionNote> = {}): ChampionNote {
  return {
    id: 1,
    user_id: 'u',
    my_champion_id: 'Ahri',
    enemy_champion_id: 'Zed',
    preset_name: 'プリセットA',
    runes: null,
    spells: ['Flash', 'Ignite'],
    items: ['1001'],
    memo: 'メモA',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

function setup(initialData?: ChampionNote) {
  return renderHook(
    ({ data }) =>
      useNoteForm({
        mode: data ? 'edit' : 'create',
        myChampionId: 'Ahri',
        enemyChampionId: 'Zed',
        initialData: data,
      }),
    { initialProps: { data: initialData } }
  );
}

describe('useNoteForm: initialData の反映', () => {
  it('initialData なしでは空のフォームで始まる', () => {
    const { result } = setup();
    expect(result.current.presetName).toBe('');
    expect(result.current.spells).toEqual([]);
    expect(result.current.items).toEqual([]);
    expect(result.current.memo).toBe('');
    expect(result.current.runes).toBeNull();
  });

  it('initialData があれば最初のレンダーから値が入る', () => {
    const { result } = setup(makeNote());
    expect(result.current.presetName).toBe('プリセットA');
    expect(result.current.spells).toEqual(['Flash', 'Ignite']);
    expect(result.current.items).toEqual(['1001']);
    expect(result.current.memo).toBe('メモA');
  });

  it('initialData が差し替わるとフォームを新しい値に戻し runeKey を更新する', () => {
    const { result, rerender } = setup(makeNote());
    act(() => result.current.setMemo('編集中'));
    const keyBefore = result.current.runeKey;

    rerender({ data: makeNote({ preset_name: 'プリセットB', memo: null }) });
    expect(result.current.presetName).toBe('プリセットB');
    expect(result.current.memo).toBe('');
    expect(result.current.runeKey).toBe(keyBefore + 1);
  });

  it('initialData が同一のままなら再レンダーしても編集内容を保持する', () => {
    const note = makeNote();
    const { result, rerender } = setup(note);
    act(() => result.current.setMemo('編集中'));
    rerender({ data: note });
    expect(result.current.memo).toBe('編集中');
  });

  it('キャンセルすると initialData の値に戻る', () => {
    const { result } = setup(makeNote());
    act(() => {
      result.current.setMemo('編集中');
      result.current.setPresetName('変更');
    });
    act(() => result.current.handleCancel());
    expect(result.current.memo).toBe('メモA');
    expect(result.current.presetName).toBe('プリセットA');
  });
});
