import { act, renderHook, waitFor } from '@testing-library/react';
import useSummonerDetail from '@/lib/hooks/useSummonerDetail';
import { fetchSummonerDetail, updateSummoner } from '@/lib/api/summoner';
import { MOCK_SUMMONER } from '@/lib/summoner-search';
import type { SummonerDetail } from '@/types/summoner';

jest.mock('@/lib/api/summoner');

const mockFetch = jest.mocked(fetchSummonerDetail);
const mockUpdate = jest.mocked(updateSummoner);

function makeDetail(level: number): SummonerDetail {
  return {
    summoner: { ...MOCK_SUMMONER, level },
    rankPosition: null,
    matches: [],
    championStats: [],
  };
}

describe('useSummonerDetail', () => {
  beforeEach(() => jest.resetAllMocks());

  it('マウント時に取得し、detail を設定する', async () => {
    mockFetch.mockResolvedValue(makeDetail(1));
    const { result } = renderHook(() => useSummonerDetail('JP', 'a', 'JP1'));
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.detail?.summoner.level).toBe(1);
    expect(mockFetch).toHaveBeenCalledWith('JP', 'a', 'JP1');
  });

  it('取得失敗時は error を設定する', async () => {
    mockFetch.mockRejectedValue(new Error('サモナーが見つかりません'));
    const { result } = renderHook(() => useSummonerDetail('JP', 'a', 'JP1'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe('サモナーが見つかりません');
    expect(result.current.detail).toBeNull();
  });

  it('引数が変わると取得し直す', async () => {
    mockFetch.mockResolvedValue(makeDetail(1));
    const { result, rerender } = renderHook(
      ({ name }) => useSummonerDetail('JP', name, 'JP1'),
      { initialProps: { name: 'a' } }
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    mockFetch.mockResolvedValue(makeDetail(2));
    rerender({ name: 'b' });
    await waitFor(() => expect(result.current.detail?.summoner.level).toBe(2));
    expect(mockFetch).toHaveBeenLastCalledWith('JP', 'b', 'JP1');
  });

  it('更新成功時は detail を差し替え updateError をクリアする', async () => {
    mockFetch.mockResolvedValue(makeDetail(1));
    mockUpdate.mockRejectedValueOnce(new Error('失敗'));
    const { result } = renderHook(() => useSummonerDetail('JP', 'a', 'JP1'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(() => result.current.update());
    expect(result.current.updateError).toBe('失敗');
    mockUpdate.mockResolvedValueOnce(makeDetail(5));
    await act(() => result.current.update());
    expect(result.current.updateError).toBeNull();
    expect(result.current.detail?.summoner.level).toBe(5);
  });

  it('更新失敗時は detail を保持し updateError を設定する', async () => {
    mockFetch.mockResolvedValue(makeDetail(1));
    mockUpdate.mockRejectedValue(new Error('レート制限'));
    const { result } = renderHook(() => useSummonerDetail('JP', 'a', 'JP1'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(() => result.current.update());
    expect(result.current.updateError).toBe('レート制限');
    expect(result.current.detail?.summoner.level).toBe(1);
    expect(result.current.isUpdating).toBe(false);
  });

  it('更新中は二重実行しない', async () => {
    mockFetch.mockResolvedValue(makeDetail(1));
    let resolveUpdate: (d: SummonerDetail) => void = () => {};
    mockUpdate.mockReturnValue(
      new Promise<SummonerDetail>((resolve) => {
        resolveUpdate = resolve;
      })
    );
    const { result } = renderHook(() => useSummonerDetail('JP', 'a', 'JP1'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    let first: Promise<void> = Promise.resolve();
    act(() => {
      first = result.current.update();
      void result.current.update();
    });
    expect(result.current.isUpdating).toBe(true);
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    await act(async () => {
      resolveUpdate(makeDetail(9));
      await first;
    });
    expect(result.current.isUpdating).toBe(false);
    expect(result.current.detail?.summoner.level).toBe(9);
  });
});
