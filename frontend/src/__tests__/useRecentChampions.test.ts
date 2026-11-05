import { act, renderHook } from '@testing-library/react';
import useRecentChampions from '@/lib/hooks/useRecentChampions';
import { champions } from '@/lib/data/champions';

const STORAGE_KEY = 'lollab_recent_champions';

function ids(result: { current: ReturnType<typeof useRecentChampions> }) {
  return result.current.recentChampions.map((c) => c.id);
}

describe('useRecentChampions', () => {
  beforeEach(() => localStorage.clear());

  it('localStorage の履歴を読み込む', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(['Zed', 'Ahri']));
    const { result } = renderHook(() => useRecentChampions());
    expect(ids(result)).toEqual(['Zed', 'Ahri']);
  });

  it('履歴が無い・壊れている場合は空になる', () => {
    const { result } = renderHook(() => useRecentChampions());
    expect(ids(result)).toEqual([]);

    localStorage.setItem(STORAGE_KEY, '{broken');
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const { result: broken } = renderHook(() => useRecentChampions());
    expect(ids(broken)).toEqual([]);
  });

  it('追加すると先頭に入り、localStorage にも保存される', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(['Zed']));
    const { result } = renderHook(() => useRecentChampions());
    act(() => result.current.addRecentChampion('Ahri'));
    expect(ids(result)).toEqual(['Ahri', 'Zed']);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')).toEqual([
      'Ahri',
      'Zed',
    ]);
  });

  it('既に履歴にあるチャンピオンは重複せず先頭に移動する', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(['Zed', 'Ahri']));
    const { result } = renderHook(() => useRecentChampions());
    act(() => result.current.addRecentChampion('Ahri'));
    expect(ids(result)).toEqual(['Ahri', 'Zed']);
  });

  it('11件目を追加すると最も古いものが削除され10件に収まる', () => {
    const all = champions.slice(0, 11).map((c) => c.id);
    const { result } = renderHook(() => useRecentChampions());
    act(() => all.forEach((id) => result.current.addRecentChampion(id)));
    expect(ids(result)).toEqual(all.slice(1).reverse());
  });

  it('同じ履歴を購読している別のフックにも反映される', () => {
    const first = renderHook(() => useRecentChampions());
    const second = renderHook(() => useRecentChampions());
    act(() => first.result.current.addRecentChampion('Zed'));
    expect(ids(second.result)).toEqual(['Zed']);
  });
});
