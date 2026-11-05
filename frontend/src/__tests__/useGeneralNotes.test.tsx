import { renderHook, waitFor } from '@testing-library/react';
import { useGeneralNotes } from '@/components/notes/GeneralNoteList';
import { getGeneralNotes } from '@/adapters/supabase';
import type { GeneralNote } from '@/types/generalNote';

jest.mock('@/adapters/supabase', () => ({ getGeneralNotes: jest.fn() }));
// GeneralNoteList の index 経由で読み込まれる子コンポーネントの依存を遮断する
jest.mock('@/components/notes/GeneralNoteCard', () => ({
  GeneralNoteCard: () => null,
}));

const mockGet = jest.mocked(getGeneralNotes);

function makeNote(id: number): GeneralNote {
  return {
    id,
    user_id: 'u',
    title: `note-${id}`,
    body: null,
    tags: [],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };
}

describe('useGeneralNotes', () => {
  beforeEach(() => jest.resetAllMocks());

  it('取得中は isLoading、完了後に notes を返す', async () => {
    mockGet.mockResolvedValue([makeNote(1)]);
    const { result } = renderHook(() => useGeneralNotes(0));
    expect(result.current.isLoading).toBe(true);
    expect(result.current.notes).toEqual([]);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.notes).toEqual([makeNote(1)]);
    expect(result.current.hasError).toBe(false);
  });

  it('refreshKey が変わると再び isLoading になり、取得し直す', async () => {
    mockGet.mockResolvedValue([makeNote(1)]);
    const { result, rerender } = renderHook(({ k }) => useGeneralNotes(k), {
      initialProps: { k: 0 },
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    mockGet.mockResolvedValue([makeNote(2)]);
    rerender({ k: 1 });
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.notes).toEqual([makeNote(2)]);
    expect(mockGet).toHaveBeenCalledTimes(2);
  });

  it('取得失敗時は hasError になり、直前のノートを保持する', async () => {
    mockGet.mockResolvedValue([makeNote(1)]);
    const { result, rerender } = renderHook(({ k }) => useGeneralNotes(k), {
      initialProps: { k: 0 },
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    mockGet.mockRejectedValue(new Error('fail'));
    rerender({ k: 1 });
    expect(result.current.hasError).toBe(false);
    await waitFor(() => expect(result.current.hasError).toBe(true));
    expect(result.current.isLoading).toBe(false);
    expect(result.current.notes).toEqual([makeNote(1)]);
  });

  it('古い refreshKey の応答が後から届いても結果を上書きしない', async () => {
    let resolveOld: (n: GeneralNote[]) => void = () => {};
    mockGet.mockReturnValueOnce(
      new Promise<GeneralNote[]>((resolve) => {
        resolveOld = resolve;
      })
    );
    const { result, rerender } = renderHook(({ k }) => useGeneralNotes(k), {
      initialProps: { k: 0 },
    });
    mockGet.mockResolvedValue([makeNote(2)]);
    rerender({ k: 1 });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    resolveOld([makeNote(1)]);
    await Promise.resolve();
    expect(result.current.notes).toEqual([makeNote(2)]);
  });
});
