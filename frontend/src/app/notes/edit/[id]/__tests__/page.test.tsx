/**
 * ノート編集ページの統合テスト
 * 
 * 要件: 5.1, 5.2, 5.7, 6.1, 6.2, 6.4, 6.7
 * 
 * このテストファイルは、ノート編集ページ(/notes/edit/[id])の統合テストを提供します。
 * - ノート編集フローのテスト
 * - 既存データの表示テスト
 * - 更新成功時のリダイレクトテスト
 * - 404エラーのテスト
 * - 権限エラーのテスト
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import EditNotePage from '../page';
import { fetchNote, updateNote } from '@/lib/api/notes';
import { LoadingContext } from '@/lib/contexts/LoadingContext';

// モック設定
jest.mock('next-auth/react');
jest.mock('next/navigation');
jest.mock('@/lib/api/notes');
jest.mock('@/lib/supabase', () => ({
    supabase: {
        from: jest.fn(),
    },
}));

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseParams = useParams as jest.MockedFunction<typeof useParams>;
const mockFetchNote = fetchNote as jest.MockedFunction<typeof fetchNote>;
const mockUpdateNote = updateNote as jest.MockedFunction<typeof updateNote>;

describe('EditNotePage - 統合テスト', () => {
    const mockPush = jest.fn();
    const mockSetLoading = jest.fn();

    // テスト用のモックデータ
    const mockSession = {
        user: {
            email: 'test@example.com',
            name: 'Test User',
        },
        expires: '2024-12-31',
    };

    const mockNote = {
        id: 1,
        user_id: 'test-user-id',
        note_type: 'matchup' as const,
        my_champion_id: 'Ahri',
        enemy_champion_id: 'Yasuo',
        runes: null,
        spells: null,
        items: null,
        memo: 'Yasuoのウィンドウォールに注意',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
    };

    // テストヘルパー: LoadingContextプロバイダーでラップ
    const renderWithContext = (component: React.ReactElement) => {
        return render(
            <LoadingContext.Provider value={{ loading: false, setLoading: mockSetLoading }}>
                {component}
            </LoadingContext.Provider>
        );
    };

    beforeEach(() => {
        jest.clearAllMocks();

        // デフォルトのモック設定
        mockUseRouter.mockReturnValue({
            push: mockPush,
            back: jest.fn(),
            forward: jest.fn(),
            refresh: jest.fn(),
            replace: jest.fn(),
            prefetch: jest.fn(),
        } as any);

        mockUseParams.mockReturnValue({
            id: '1',
        });

        mockUseSession.mockReturnValue({
            data: mockSession,
            status: 'authenticated',
            update: jest.fn(),
        });
    });

    describe('要件5.1, 5.2: ノート編集ページの表示と既存データの表示', () => {
        it('既存のノートデータを正しく取得して表示する', async () => {
            mockFetchNote.mockResolvedValue(mockNote);

            renderWithContext(<EditNotePage />);

            // ノート取得APIが正しいパラメータで呼ばれることを確認
            await waitFor(() => {
                expect(mockFetchNote).toHaveBeenCalledWith(1, 'test@example.com');
            });

            // ページタイトルが表示されることを確認
            await waitFor(() => {
                expect(screen.getByText('ノート編集')).toBeInTheDocument();
            });

            // フォームが表示されることを確認
            await waitFor(() => {
                expect(screen.getByText('マイチャンピオン')).toBeInTheDocument();
            });
        });

        it('対策ノートの場合、敵チャンピオン選択UIが表示される', async () => {
            mockFetchNote.mockResolvedValue(mockNote);

            renderWithContext(<EditNotePage />);

            await waitFor(() => {
                expect(screen.getByText('敵チャンピオン')).toBeInTheDocument();
            });
        });

        it('汎用ノートの場合、敵チャンピオン選択UIが表示されない', async () => {
            const generalNote = {
                ...mockNote,
                note_type: 'general' as const,
                enemy_champion_id: null,
            };
            mockFetchNote.mockResolvedValue(generalNote);

            renderWithContext(<EditNotePage />);

            await waitFor(() => {
                expect(screen.getByText('マイチャンピオン')).toBeInTheDocument();
            });

            // 敵チャンピオン選択UIが表示されないことを確認
            expect(screen.queryByText('敵チャンピオン')).not.toBeInTheDocument();
        });

        it('既存の戦略メモが表示される', async () => {
            mockFetchNote.mockResolvedValue(mockNote);

            renderWithContext(<EditNotePage />);

            await waitFor(() => {
                const memoTextarea = screen.getByLabelText('戦略メモ') as HTMLTextAreaElement;
                expect(memoTextarea.value).toBe('Yasuoのウィンドウォールに注意');
            });
        });

        it('ノートタイプが変更不可であることを示すメッセージが表示される', async () => {
            mockFetchNote.mockResolvedValue(mockNote);

            renderWithContext(<EditNotePage />);

            await waitFor(() => {
                expect(screen.getByText('※ 編集モードではノートタイプを変更できません')).toBeInTheDocument();
            });
        });
    });

    describe('要件5.7, 6.1, 6.2: ノート編集フローと更新機能', () => {
        it('フォームを編集して保存すると、更新APIが呼ばれる', async () => {
            mockFetchNote.mockResolvedValue(mockNote);
            mockUpdateNote.mockResolvedValue({ ...mockNote, memo: '更新されたメモ' });

            const user = userEvent.setup();
            renderWithContext(<EditNotePage />);

            // フォームが表示されるまで待機
            await waitFor(() => {
                expect(screen.getByLabelText('戦略メモ')).toBeInTheDocument();
            });

            // メモを編集
            const memoTextarea = screen.getByLabelText('戦略メモ');
            await user.clear(memoTextarea);
            await user.type(memoTextarea, '更新されたメモ');

            // 保存ボタンをクリック
            const saveButton = screen.getByRole('button', { name: /保存/ });
            await user.click(saveButton);

            // 更新APIが正しいパラメータで呼ばれることを確認
            await waitFor(() => {
                expect(mockUpdateNote).toHaveBeenCalledWith(1, {
                    my_champion_id: 'Ahri',
                    enemy_champion_id: 'Yasuo',
                    memo: '更新されたメモ',
                });
            });
        });

        it('保存中はローディング状態が表示される', async () => {
            mockFetchNote.mockResolvedValue(mockNote);
            mockUpdateNote.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

            const user = userEvent.setup();
            renderWithContext(<EditNotePage />);

            await waitFor(() => {
                expect(screen.getByLabelText('戦略メモ')).toBeInTheDocument();
            });

            // 保存ボタンをクリック
            const saveButton = screen.getByRole('button', { name: /保存/ });
            await user.click(saveButton);

            // ローディング状態が表示されることを確認
            expect(screen.getByRole('button', { name: /保存中/ })).toBeInTheDocument();
            expect(mockSetLoading).toHaveBeenCalledWith(true);
        });

        it('キャンセルボタンをクリックすると、ノート一覧ページに戻る', async () => {
            mockFetchNote.mockResolvedValue(mockNote);

            const user = userEvent.setup();
            renderWithContext(<EditNotePage />);

            await waitFor(() => {
                expect(screen.getByLabelText('戦略メモ')).toBeInTheDocument();
            });

            // キャンセルボタンをクリック
            const cancelButton = screen.getByRole('button', { name: /キャンセル/ });
            await user.click(cancelButton);

            // ノート一覧ページにリダイレクトされることを確認
            expect(mockPush).toHaveBeenCalledWith('/notes');
        });
    });

    describe('要件6.4: 更新成功時のリダイレクト', () => {
        it('更新が成功すると、ノート一覧ページにリダイレクトされる', async () => {
            mockFetchNote.mockResolvedValue(mockNote);
            mockUpdateNote.mockResolvedValue({ ...mockNote, memo: '更新されたメモ' });

            const user = userEvent.setup();
            renderWithContext(<EditNotePage />);

            await waitFor(() => {
                expect(screen.getByLabelText('戦略メモ')).toBeInTheDocument();
            });

            // 保存ボタンをクリック
            const saveButton = screen.getByRole('button', { name: /保存/ });
            await user.click(saveButton);

            // ノート一覧ページにリダイレクトされることを確認
            await waitFor(() => {
                expect(mockPush).toHaveBeenCalledWith('/notes');
            });
        });
    });

    describe('要件5.7: 404エラーのテスト', () => {
        it('ノートが存在しない場合、404エラーメッセージが表示される', async () => {
            mockFetchNote.mockRejectedValue(new Error('ノートが見つかりませんでした'));

            renderWithContext(<EditNotePage />);

            // エラーメッセージが表示されることを確認
            await waitFor(() => {
                expect(screen.getByText('ノートが見つかりませんでした')).toBeInTheDocument();
            });

            // ノート一覧に戻るボタンが表示されることを確認
            expect(screen.getByRole('button', { name: /ノート一覧に戻る/ })).toBeInTheDocument();
        });

        it('404エラー時、ノート一覧に戻るボタンをクリックするとリダイレクトされる', async () => {
            mockFetchNote.mockRejectedValue(new Error('ノートが見つかりませんでした'));

            const user = userEvent.setup();
            renderWithContext(<EditNotePage />);

            await waitFor(() => {
                expect(screen.getByText('ノートが見つかりませんでした')).toBeInTheDocument();
            });

            // ノート一覧に戻るボタンをクリック
            const backButton = screen.getByRole('button', { name: /ノート一覧に戻る/ });
            await user.click(backButton);

            // ノート一覧ページにリダイレクトされることを確認
            expect(mockPush).toHaveBeenCalledWith('/notes');
        });
    });

    describe('要件6.7: 権限エラーのテスト', () => {
        it('他のユーザーのノートにアクセスすると、権限エラーメッセージが表示される', async () => {
            mockFetchNote.mockRejectedValue(new Error('このノートにアクセスする権限がありません'));

            renderWithContext(<EditNotePage />);

            // エラーメッセージが表示されることを確認
            await waitFor(() => {
                expect(screen.getByText('このノートにアクセスする権限がありません')).toBeInTheDocument();
            });

            // ノート一覧に戻るボタンが表示されることを確認
            expect(screen.getByRole('button', { name: /ノート一覧に戻る/ })).toBeInTheDocument();
        });

        it('更新時に権限エラーが発生すると、エラーメッセージが表示される', async () => {
            mockFetchNote.mockResolvedValue(mockNote);
            mockUpdateNote.mockRejectedValue(new Error('このノートを更新する権限がありません'));

            const user = userEvent.setup();
            renderWithContext(<EditNotePage />);

            await waitFor(() => {
                expect(screen.getByLabelText('戦略メモ')).toBeInTheDocument();
            });

            // 保存ボタンをクリック
            const saveButton = screen.getByRole('button', { name: /保存/ });
            await user.click(saveButton);

            // エラーメッセージが表示されることを確認
            await waitFor(() => {
                expect(screen.getByText('このノートを更新する権限がありません')).toBeInTheDocument();
            });
        });

        it('権限エラーメッセージは3秒後に自動的に非表示になる', async () => {
            jest.useFakeTimers();

            mockFetchNote.mockResolvedValue(mockNote);
            mockUpdateNote.mockRejectedValue(new Error('このノートを更新する権限がありません'));

            const user = userEvent.setup({ delay: null });
            renderWithContext(<EditNotePage />);

            await waitFor(() => {
                expect(screen.getByLabelText('戦略メモ')).toBeInTheDocument();
            });

            // 保存ボタンをクリック
            const saveButton = screen.getByRole('button', { name: /保存/ });
            await user.click(saveButton);

            // エラーメッセージが表示されることを確認
            await waitFor(() => {
                expect(screen.getByText('このノートを更新する権限がありません')).toBeInTheDocument();
            });

            // 3秒経過
            jest.advanceTimersByTime(3000);

            // エラーメッセージが非表示になることを確認
            await waitFor(() => {
                expect(screen.queryByText('このノートを更新する権限がありません')).not.toBeInTheDocument();
            });

            jest.useRealTimers();
        });
    });

    describe('認証状態の確認', () => {
        it('未認証ユーザーはログインページにリダイレクトされる', () => {
            mockUseSession.mockReturnValue({
                data: null,
                status: 'unauthenticated',
                update: jest.fn(),
            });

            renderWithContext(<EditNotePage />);

            // ログインページにリダイレクトされることを確認
            expect(mockPush).toHaveBeenCalledWith('/api/auth/signin');
        });

        it('認証チェック中はローディング表示される', () => {
            mockUseSession.mockReturnValue({
                data: null,
                status: 'loading',
                update: jest.fn(),
            });

            const { container } = renderWithContext(<EditNotePage />);

            // 何も表示されないことを確認（GlobalLoadingが表示される）
            expect(container.firstChild).toBeNull();
        });
    });

    describe('エラーハンドリング', () => {
        it('データベース接続エラーが発生すると、適切なエラーメッセージが表示される', async () => {
            mockFetchNote.mockRejectedValue(new Error('データベースに接続できませんでした'));

            renderWithContext(<EditNotePage />);

            await waitFor(() => {
                expect(screen.getByText('データベースに接続できませんでした')).toBeInTheDocument();
            });
        });

        it('ネットワークエラーが発生すると、適切なエラーメッセージが表示される', async () => {
            mockFetchNote.mockRejectedValue(new Error('ネットワークエラーが発生しました'));

            renderWithContext(<EditNotePage />);

            await waitFor(() => {
                expect(screen.getByText('ネットワークエラーが発生しました')).toBeInTheDocument();
            });
        });

        it('更新時の一般的なエラーが適切に処理される', async () => {
            mockFetchNote.mockResolvedValue(mockNote);
            mockUpdateNote.mockRejectedValue(new Error('予期しないエラー'));

            const user = userEvent.setup();
            renderWithContext(<EditNotePage />);

            await waitFor(() => {
                expect(screen.getByLabelText('戦略メモ')).toBeInTheDocument();
            });

            // 保存ボタンをクリック
            const saveButton = screen.getByRole('button', { name: /保存/ });
            await user.click(saveButton);

            // エラーメッセージが表示されることを確認
            await waitFor(() => {
                expect(screen.getByText('予期しないエラー')).toBeInTheDocument();
            });
        });
    });

    describe('ローディング状態の管理', () => {
        it('ノート読み込み中はグローバルローディングが有効になる', async () => {
            mockFetchNote.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

            renderWithContext(<EditNotePage />);

            // ローディングが有効になることを確認
            await waitFor(() => {
                expect(mockSetLoading).toHaveBeenCalledWith(true);
            });
        });

        it('ノート読み込み完了後はグローバルローディングが無効になる', async () => {
            mockFetchNote.mockResolvedValue(mockNote);

            renderWithContext(<EditNotePage />);

            await waitFor(() => {
                expect(mockSetLoading).toHaveBeenCalledWith(false);
            });
        });

        it('更新完了後はグローバルローディングが無効になる', async () => {
            mockFetchNote.mockResolvedValue(mockNote);
            mockUpdateNote.mockResolvedValue({ ...mockNote, memo: '更新されたメモ' });

            const user = userEvent.setup();
            renderWithContext(<EditNotePage />);

            await waitFor(() => {
                expect(screen.getByLabelText('戦略メモ')).toBeInTheDocument();
            });

            // 保存ボタンをクリック
            const saveButton = screen.getByRole('button', { name: /保存/ });
            await user.click(saveButton);

            await waitFor(() => {
                expect(mockSetLoading).toHaveBeenCalledWith(false);
            });
        });
    });
});
