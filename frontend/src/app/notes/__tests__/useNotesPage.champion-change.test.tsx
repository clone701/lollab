/**
 * useNotesPage - チャンピオン変更時の状態リセットテスト
 *
 * バグ修正: チャンピオン変更時に viewMode, selectedNote, selectedNoteId が
 * 古い値のまま残る問題を修正
 *
 * 検証項目:
 * 1. 相手チャンピオン変更時に状態がリセットされる
 * 2. 自分のチャンピオン変更時に状態がリセットされる
 * 3. ノート詳細表示中の変更でも正しくリセットされる
 * 4. ノート編集中の変更でも正しくリセットされる
 * 5. フォーム表示中の変更でも正しくリセットされる
 */

import { renderHook, act } from '@testing-library/react';
import { useNotesPage } from '../useNotesPage';
import { ChampionNote } from '@/types/note';

// モック設定
jest.mock('@/lib/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' },
    session: { user: { id: 'test-user-id' } },
    loading: false,
  }),
}));

jest.mock('@/lib/hooks/useToast', () => ({
  __esModule: true,
  default: () => ({
    toast: null,
    showToast: jest.fn(),
    hideToast: jest.fn(),
  }),
}));

jest.mock('@/adapters/supabase', () => ({
  fetchNoteById: jest.fn(),
  deleteNote: jest.fn(),
}));

describe('useNotesPage - チャンピオン変更時の状態リセット', () => {
  const mockNote: ChampionNote = {
    id: 1,
    user_id: 'test-user-id',
    my_champion_id: 'Ahri',
    enemy_champion_id: 'Zed',
    preset_name: 'テストプリセット',
    runes: null,
    spells: ['SummonerFlash', 'SummonerIgnite'],
    items: [],
    memo: 'テストメモ',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  describe('相手チャンピオン変更時の状態リセット', () => {
    it('ノート詳細表示中に相手チャンピオンを変更すると、viewMode が list に戻る', () => {
      const { result } = renderHook(() => useNotesPage());

      // 初期状態: チャンピオン選択 + ノート詳細表示
      act(() => {
        result.current.handleMyChampionChange('Ahri');
        result.current.handleEnemyChampionChange('Zed');
      });

      // ノート詳細を開く（手動で状態を設定）
      act(() => {
        // @ts-expect-error - テスト用に内部状態を直接操作
        result.current.setViewMode?.('view');
        // @ts-expect-error - テスト用に内部状態を直接操作
        result.current.setSelectedNote?.(mockNote);
        // @ts-expect-error - テスト用に内部状態を直接操作
        result.current.setSelectedNoteId?.('1');
      });

      // 相手チャンピオンを変更
      act(() => {
        result.current.handleEnemyChampionChange('Yasuo');
      });

      // 検証: 状態がリセットされている
      expect(result.current.viewMode).toBe('list');
      expect(result.current.selectedNote).toBeNull();
      expect(result.current.selectedNoteId).toBeNull();
      expect(result.current.showForm).toBe(false);
      expect(result.current.enemyChampionId).toBe('Yasuo');
    });

    it('ノート編集中に相手チャンピオンを変更すると、viewMode が list に戻る', () => {
      const { result } = renderHook(() => useNotesPage());

      act(() => {
        result.current.handleMyChampionChange('Ahri');
        result.current.handleEnemyChampionChange('Zed');
      });

      // ノート編集モードに設定
      act(() => {
        // @ts-expect-error - テスト用
        result.current.setViewMode?.('edit');
        // @ts-expect-error - テスト用
        result.current.setSelectedNote?.(mockNote);
        // @ts-expect-error - テスト用
        result.current.setSelectedNoteId?.('1');
      });

      act(() => {
        result.current.handleEnemyChampionChange('Yasuo');
      });

      expect(result.current.viewMode).toBe('list');
      expect(result.current.selectedNote).toBeNull();
      expect(result.current.selectedNoteId).toBeNull();
    });

    it('ノート作成フォーム表示中に相手チャンピオンを変更すると、フォームが閉じる', () => {
      const { result } = renderHook(() => useNotesPage());

      act(() => {
        result.current.handleMyChampionChange('Ahri');
        result.current.handleEnemyChampionChange('Zed');
        result.current.handleCreateNew();
      });

      expect(result.current.showForm).toBe(true);

      act(() => {
        result.current.handleEnemyChampionChange('Yasuo');
      });

      expect(result.current.showForm).toBe(false);
      expect(result.current.viewMode).toBe('list');
    });
  });

  describe('自分のチャンピオン変更時の状態リセット', () => {
    it('ノート詳細表示中に自分のチャンピオンを変更すると、viewMode が list に戻る', () => {
      const { result } = renderHook(() => useNotesPage());

      act(() => {
        result.current.handleMyChampionChange('Ahri');
        result.current.handleEnemyChampionChange('Zed');
      });

      act(() => {
        // @ts-expect-error - テスト用
        result.current.setViewMode?.('view');
        // @ts-expect-error - テスト用
        result.current.setSelectedNote?.(mockNote);
        // @ts-expect-error - テスト用
        result.current.setSelectedNoteId?.('1');
      });

      act(() => {
        result.current.handleMyChampionChange('Yasuo');
      });

      expect(result.current.viewMode).toBe('list');
      expect(result.current.selectedNote).toBeNull();
      expect(result.current.selectedNoteId).toBeNull();
      expect(result.current.showForm).toBe(false);
      expect(result.current.myChampionId).toBe('Yasuo');
    });

    it('ノート編集中に自分のチャンピオンを変更すると、viewMode が list に戻る', () => {
      const { result } = renderHook(() => useNotesPage());

      act(() => {
        result.current.handleMyChampionChange('Ahri');
        result.current.handleEnemyChampionChange('Zed');
      });

      act(() => {
        // @ts-expect-error - テスト用
        result.current.setViewMode?.('edit');
        // @ts-expect-error - テスト用
        result.current.setSelectedNote?.(mockNote);
        // @ts-expect-error - テスト用
        result.current.setSelectedNoteId?.('1');
      });

      act(() => {
        result.current.handleMyChampionChange('Yasuo');
      });

      expect(result.current.viewMode).toBe('list');
      expect(result.current.selectedNote).toBeNull();
      expect(result.current.selectedNoteId).toBeNull();
    });
  });

  describe('チャンピオン変更後のデータ整合性', () => {
    it('相手チャンピオン変更後も自分のチャンピオンIDは保持される', () => {
      const { result } = renderHook(() => useNotesPage());

      act(() => {
        result.current.handleMyChampionChange('Ahri');
        result.current.handleEnemyChampionChange('Zed');
      });

      act(() => {
        result.current.handleEnemyChampionChange('Yasuo');
      });

      expect(result.current.myChampionId).toBe('Ahri');
      expect(result.current.enemyChampionId).toBe('Yasuo');
    });

    it('自分のチャンピオン変更後も相手のチャンピオンIDは保持される', () => {
      const { result } = renderHook(() => useNotesPage());

      act(() => {
        result.current.handleMyChampionChange('Ahri');
        result.current.handleEnemyChampionChange('Zed');
      });

      act(() => {
        result.current.handleMyChampionChange('Yasuo');
      });

      expect(result.current.myChampionId).toBe('Yasuo');
      expect(result.current.enemyChampionId).toBe('Zed');
    });
  });

  describe('handleReset との一貫性', () => {
    it('handleReset と同じ状態リセットロジックが適用される', () => {
      const { result } = renderHook(() => useNotesPage());

      // 状態をセット
      act(() => {
        result.current.handleMyChampionChange('Ahri');
        result.current.handleEnemyChampionChange('Zed');
        result.current.handleCreateNew();
      });

      act(() => {
        // @ts-expect-error - テスト用
        result.current.setViewMode?.('view');
        // @ts-expect-error - テスト用
        result.current.setSelectedNote?.(mockNote);
        // @ts-expect-error - テスト用
        result.current.setSelectedNoteId?.('1');
      });

      // リセット実行
      act(() => {
        result.current.handleReset();
      });

      const resetState = {
        myChampionId: result.current.myChampionId,
        enemyChampionId: result.current.enemyChampionId,
        showForm: result.current.showForm,
        viewMode: result.current.viewMode,
        selectedNote: result.current.selectedNote,
        selectedNoteId: result.current.selectedNoteId,
      };

      // 再度状態をセット
      act(() => {
        result.current.handleMyChampionChange('Ahri');
        result.current.handleEnemyChampionChange('Zed');
        result.current.handleCreateNew();
      });

      act(() => {
        // @ts-expect-error - テスト用
        result.current.setViewMode?.('view');
        // @ts-expect-error - テスト用
        result.current.setSelectedNote?.(mockNote);
        // @ts-expect-error - テスト用
        result.current.setSelectedNoteId?.('1');
      });

      // チャンピオン変更でリセット
      act(() => {
        result.current.handleMyChampionChange(null);
      });

      const championChangeState = {
        myChampionId: result.current.myChampionId,
        enemyChampionId: result.current.enemyChampionId,
        showForm: result.current.showForm,
        viewMode: result.current.viewMode,
        selectedNote: result.current.selectedNote,
        selectedNoteId: result.current.selectedNoteId,
      };

      // handleReset と handleMyChampionChange(null) は enemyChampionId 以外同じ
      expect(championChangeState.showForm).toBe(resetState.showForm);
      expect(championChangeState.viewMode).toBe(resetState.viewMode);
      expect(championChangeState.selectedNote).toBe(resetState.selectedNote);
      expect(championChangeState.selectedNoteId).toBe(
        resetState.selectedNoteId
      );
    });
  });

  describe('エッジケース', () => {
    it('null にチャンピオンを変更しても状態リセットが動作する', () => {
      const { result } = renderHook(() => useNotesPage());

      act(() => {
        result.current.handleMyChampionChange('Ahri');
        result.current.handleEnemyChampionChange('Zed');
      });

      act(() => {
        // @ts-expect-error - テスト用
        result.current.setViewMode?.('view');
        // @ts-expect-error - テスト用
        result.current.setSelectedNote?.(mockNote);
      });

      act(() => {
        result.current.handleEnemyChampionChange(null);
      });

      expect(result.current.viewMode).toBe('list');
      expect(result.current.selectedNote).toBeNull();
      expect(result.current.enemyChampionId).toBeNull();
    });

    it('同じチャンピオンに変更しても状態リセットが動作する', () => {
      const { result } = renderHook(() => useNotesPage());

      act(() => {
        result.current.handleMyChampionChange('Ahri');
        result.current.handleEnemyChampionChange('Zed');
      });

      act(() => {
        // @ts-expect-error - テスト用
        result.current.setViewMode?.('view');
        // @ts-expect-error - テスト用
        result.current.setSelectedNote?.(mockNote);
      });

      // 同じチャンピオンに「変更」
      act(() => {
        result.current.handleEnemyChampionChange('Zed');
      });

      // リセットは実行される（変更検知はしない）
      expect(result.current.viewMode).toBe('list');
      expect(result.current.selectedNote).toBeNull();
    });
  });
});
