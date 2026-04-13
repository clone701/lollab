/**
 * NoteForm初期化ロジックのテスト
 * タスク3.4: initialDataが渡された場合のフォーム初期化
 */

import { render, screen, waitFor } from '@testing-library/react';
import NoteForm from '../NoteForm';
import { ChampionNote } from '@/types/note';
import { AuthContextProvider } from '@/lib/contexts/AuthContext';

// Supabaseクライアントをモック
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getSession: jest
        .fn()
        .mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
  })),
}));

// モックデータ
const mockInitialData: ChampionNote = {
  id: 1,
  user_id: 'test-user',
  my_champion_id: 'Ahri',
  enemy_champion_id: 'Zed',
  preset_name: 'テストプリセット',
  runes: {
    primaryPath: 8200,
    secondaryPath: 8000,
    keystone: 8214,
    primaryRunes: [8226, 8210, 8234],
    secondaryRunes: [8009, 8014],
    shards: [5008, 5008, 5002],
  },
  spells: ['SummonerFlash', 'SummonerIgnite'],
  items: ['1001', '2003'],
  memo: 'テストメモ',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

// テストヘルパー: AuthContextProviderでラップ
const renderWithAuth = (ui: React.ReactElement) => {
  return render(<AuthContextProvider>{ui}</AuthContextProvider>);
};

describe('NoteForm - 初期化ロジック', () => {
  it('initialDataが渡された場合、フォームが初期化される', async () => {
    renderWithAuth(
      <NoteForm
        mode="view"
        myChampionId="Ahri"
        enemyChampionId="Zed"
        initialData={mockInitialData}
      />
    );

    // プリセット名が設定されている
    await waitFor(() => {
      const presetInput = screen.getByLabelText(
        /プリセット名/i
      ) as HTMLInputElement;
      expect(presetInput.value).toBe('テストプリセット');
    });

    // メモが設定されている
    const memoTextarea = screen.getByLabelText(
      /対策メモ/i
    ) as HTMLTextAreaElement;
    expect(memoTextarea.value).toBe('テストメモ');
  });

  it('initialDataがnullの場合、フォームは空のまま', () => {
    renderWithAuth(
      <NoteForm mode="create" myChampionId="Ahri" enemyChampionId="Zed" />
    );

    const presetInput = screen.getByLabelText(
      /プリセット名/i
    ) as HTMLInputElement;
    expect(presetInput.value).toBe('');

    const memoTextarea = screen.getByLabelText(
      /対策メモ/i
    ) as HTMLTextAreaElement;
    expect(memoTextarea.value).toBe('');
  });

  it('initialDataが変更された場合、フォームが再初期化される', async () => {
    const { rerender } = renderWithAuth(
      <NoteForm
        mode="view"
        myChampionId="Ahri"
        enemyChampionId="Zed"
        initialData={mockInitialData}
      />
    );

    // 初期値を確認
    await waitFor(() => {
      const presetInput = screen.getByLabelText(
        /プリセット名/i
      ) as HTMLInputElement;
      expect(presetInput.value).toBe('テストプリセット');
    });

    // 新しいinitialDataで再レンダリング
    const newInitialData: ChampionNote = {
      ...mockInitialData,
      preset_name: '新しいプリセット',
      memo: '新しいメモ',
    };

    rerender(
      <AuthContextProvider>
        <NoteForm
          mode="view"
          myChampionId="Ahri"
          enemyChampionId="Zed"
          initialData={newInitialData}
        />
      </AuthContextProvider>
    );

    // 新しい値が設定されている
    await waitFor(() => {
      const presetInput = screen.getByLabelText(
        /プリセット名/i
      ) as HTMLInputElement;
      expect(presetInput.value).toBe('新しいプリセット');
    });

    const memoTextarea = screen.getByLabelText(
      /対策メモ/i
    ) as HTMLTextAreaElement;
    expect(memoTextarea.value).toBe('新しいメモ');
  });
});
