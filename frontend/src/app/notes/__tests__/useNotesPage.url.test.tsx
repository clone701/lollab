/**
 * useNotesPage - URL のクエリ（tab・my・enemy）との連携
 *
 * 検証項目:
 * 1. クエリから初期状態を作る（不正な id は無視）
 * 2. タブ・チャンピオンの切り替えで router.replace を呼ぶ
 * 3. URL が外から変わったら状態を合わせる（マイピックのリンク）
 * 4. マイピックの未保存の変更があるとき、タブの切り替えを確認する
 */

import { act, renderHook } from '@testing-library/react';
import { useNotesPage } from '../useNotesPage';

const replace = jest.fn();
let query = '';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => new URLSearchParams(query),
}));

jest.mock('@/lib/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'u1' },
    session: { user: { id: 'u1' } },
    loading: false,
  }),
}));

jest.mock('@/adapters/supabase', () => ({
  fetchNoteById: jest.fn(),
  deleteNote: jest.fn(),
}));

describe('useNotesPage - URL のクエリ', () => {
  beforeEach(() => {
    replace.mockClear();
    query = '';
  });

  it('クエリがなければ対策ノートタブで、チャンピオンは未選択', () => {
    const { result } = renderHook(() => useNotesPage());
    expect(result.current.activeTab).toBe('matchup');
    expect(result.current.myChampionId).toBeNull();
    expect(result.current.enemyChampionId).toBeNull();
  });

  it('tab=matchup&my&enemy で、対策ノートの X vs Y が選ばれた状態になる', () => {
    query = 'tab=matchup&my=Ahri&enemy=Zed';
    const { result } = renderHook(() => useNotesPage());
    expect(result.current.activeTab).toBe('matchup');
    expect(result.current.myChampionId).toBe('Ahri');
    expect(result.current.enemyChampionId).toBe('Zed');
  });

  it('tab=mypick でマイピックタブから始まる', () => {
    query = 'tab=mypick';
    const { result } = renderHook(() => useNotesPage());
    expect(result.current.activeTab).toBe('mypick');
  });

  it('champions.ts にない id は無視する', () => {
    query = 'tab=matchup&my=NotAChampion&enemy=Zed';
    const { result } = renderHook(() => useNotesPage());
    expect(result.current.myChampionId).toBeNull();
    expect(result.current.enemyChampionId).toBe('Zed');
  });

  it('チャンピオンを選ぶと、履歴を増やさずクエリを更新する', () => {
    const { result } = renderHook(() => useNotesPage());
    act(() => result.current.handleMyChampionChange('Ahri'));
    expect(replace).toHaveBeenLastCalledWith('/notes?tab=matchup&my=Ahri');
    expect(result.current.myChampionId).toBe('Ahri');
  });

  it('タブを切り替えると、選択中のチャンピオンを保ったままクエリを更新する', () => {
    query = 'tab=matchup&my=Ahri&enemy=Zed';
    const { result } = renderHook(() => useNotesPage());
    act(() => result.current.handleTabChange('mypick'));
    expect(replace).toHaveBeenLastCalledWith(
      '/notes?tab=mypick&my=Ahri&enemy=Zed'
    );
    expect(result.current.activeTab).toBe('mypick');
  });

  it('URL が外から変わったら（マイピックのリンク）、状態を URL に合わせる', () => {
    query = 'tab=mypick';
    const { result, rerender } = renderHook(() => useNotesPage());
    query = 'tab=matchup&my=Yasuo&enemy=Zed';
    rerender();
    expect(result.current.activeTab).toBe('matchup');
    expect(result.current.myChampionId).toBe('Yasuo');
    expect(result.current.enemyChampionId).toBe('Zed');
    expect(result.current.viewMode).toBe('list');
  });
});

describe('useNotesPage - マイピックの未保存の確認', () => {
  beforeEach(() => {
    replace.mockClear();
    query = 'tab=mypick';
  });

  afterEach(() => jest.restoreAllMocks());

  it('未保存の変更があり、破棄しない場合はタブを切り替えない', () => {
    const confirm = jest.spyOn(window, 'confirm').mockReturnValue(false);
    const { result } = renderHook(() => useNotesPage());
    act(() => result.current.handlePickDirtyChange(true));
    act(() => result.current.handleTabChange('general'));
    expect(confirm).toHaveBeenCalled();
    expect(result.current.activeTab).toBe('mypick');
    expect(replace).not.toHaveBeenCalled();
  });

  it('未保存の変更があっても、破棄するならタブを切り替える', () => {
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    const { result } = renderHook(() => useNotesPage());
    act(() => result.current.handlePickDirtyChange(true));
    act(() => result.current.handleTabChange('general'));
    expect(result.current.activeTab).toBe('general');
  });

  it('未保存の変更がなければ確認しない', () => {
    const confirm = jest.spyOn(window, 'confirm');
    const { result } = renderHook(() => useNotesPage());
    act(() => result.current.handleTabChange('general'));
    expect(confirm).not.toHaveBeenCalled();
    expect(result.current.activeTab).toBe('general');
  });

  it('マイピック以外のタブからの切り替えでは確認しない', () => {
    query = 'tab=matchup';
    const confirm = jest.spyOn(window, 'confirm');
    const { result } = renderHook(() => useNotesPage());
    act(() => result.current.handlePickDirtyChange(true));
    act(() => result.current.handleTabChange('general'));
    expect(confirm).not.toHaveBeenCalled();
  });
});
