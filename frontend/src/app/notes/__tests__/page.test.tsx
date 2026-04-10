/**
 * ノート一覧ページの統合テスト
 * 
 * このテストは以下の機能を検証します：
 * - ノート一覧の表示
 * - 削除フロー（確認ダイアログ、削除実行、一覧更新）
 * - 空状態の表示
 * - エラーハンドリング
 * - 認証状態の確認
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import NotesPage from '../page';
import { fetchNotes, deleteNote } from '@/lib/api/notes';
import { ChampionNote } from '@/types/note';

// モック設定
jest.mock('next-auth/react');
jest.mock('next/navigation');
jest.mock('@/lib/api/notes');
jest.mock('@/lib/supabase', () => ({
    supabase: {
        from: jest.fn(),
        auth: {
            getSession: jest.fn(),
        },
    },
}));
jest.mock('@/lib/contexts/LoadingContext', () => ({
    LoadingContext: {
        Provider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
        Consumer: ({ children }: { children: (value: any) => React.ReactNode }) =>
            children({ setLoading: jest.fn() }),
    },
}));

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockFetchNotes = fetchNotes as jest.MockedFunction<typeof fetchNotes>;
const mockDeleteNote = deleteNote as jest.MockedFunction<typeof deleteNote>;

describe('NotesPage 統合テスト', () => {
    const mockPush = jest.fn();
    const mockSession = {
        user: {
            email: 'test@example.com',
            name: 'Test User',
        },
        expires: '2024-12-31',
    };

    // テストデータ
    const mockNotes: ChampionNote[] = [
        {
            id: 1,
            user_id: 'test-user-id',
            note_type: 'general',
            my_champion_id: 'Ahri',
            enemy_champion_id: null,
            runes: null,
            spells: null,
            items: null,
            memo: 'Ahriの汎用ビルド',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-15T12:30:00Z',
        },
        {
            id: 2,
            user_id: 'test-user-id',
            note_type: 'matchup',
            my_champion_id: 'Ahri',
            enemy_champion_id: 'Yasuo',
            runes: null,
            spells: null,
            items: null,
            memo: 'Yasuo対策：ウィンドウォールに注意',
            created_at: '2024-01-02T00:00:00Z',
            updated_at: '2024-01-20T15:45:00Z',
        },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        mockUseRouter.mockReturnValue({
            push: mockPush,
            back: jest.fn(),
            forward: jest.fn(),
            refresh: jest.fn(),
            replace: jest.fn(),
            prefetch: jest.fn(),
        } as any);

        // LoadingContextのモック
        React.useContext = jest.fn().mockReturnValue({
            setLoading: jest.fn(),
        });
    });

    describe('認証状態の確認', () => {
        it('認証中はローディング状態を表示する', () => {
            mockUseSession.mockReturnValue({
                data: null,
                status: 'loading',
                update: jest.fn(),
            });

            const { container } = render(<NotesPage />);
            expect(container.firstChild).toBeNull();
        });

        it('未認証の場合はログインページにリダイレクトする', () => {
            mockUseSession.mockReturnValue({
                data: null,
                status: 'unauthenticated',
                update: jest.fn(),
            });

            render(<NotesPage />);

            waitFor(() => {
                expect(mockPush).toHaveBeenCalledWith('/api/auth/signin');
            });
        });

        it('認証済みの場合はノート一覧を表示する', async () => {
            mockUseSession.mockReturnValue({
                data: mockSession,
                status: 'authenticated',
                update: jest.fn(),
            });
            mockFetchNotes.mockResolvedValue(mockNotes);

            render(<NotesPage />);

            await waitFor(() => {
                expect(screen.getByText('チャンピオンノート')).toBeInTheDocument();
            });
        });
    });

    describe('ノート一覧の表示', () => {
        beforeEach(() => {
            mockUseSession.mockReturnValue({
                data: mockSession,
                status: 'authenticated',
                update: jest.fn(),
            });
        });

        it('ノート一覧が正しく表示される', async () => {
            mockFetchNotes.mockResolvedValue(mockNotes);

            render(<NotesPage />);

            await waitFor(() => {
                expect(screen.getByText('Ahriの汎用ビルド')).toBeInTheDocument();
                expect(screen.getByText('Yasuo対策：ウィンドウォールに注意')).toBeInTheDocument();
            });
        });

        it('ノートタイプバッジが正しく表示される', async () => {
            mockFetchNotes.mockResolvedValue(mockNotes);

            render(<NotesPage />);

            await waitFor(() => {
                const generalBadge = screen.getByText('汎用');
                const matchupBadge = screen.getByText('対策');

                expect(generalBadge).toBeInTheDocument();
                expect(matchupBadge).toBeInTheDocument();
            });
        });

        it('新規作成ボタンが表示される', async () => {
            mockFetchNotes.mockResolvedValue(mockNotes);

            render(<NotesPage />);

            await waitFor(() => {
                const createButtons = screen.getAllByText('新規作成');
                expect(createButtons.length).toBeGreaterThan(0);
            });
        });

        it('編集ボタンと削除ボタンが各ノートに表示される', async () => {
            mockFetchNotes.mockResolvedValue(mockNotes);

            render(<NotesPage />);

            await waitFor(() => {
                const editButtons = screen.getAllByText('編集');
                const deleteButtons = screen.getAllByText('削除');

                expect(editButtons).toHaveLength(2);
                expect(deleteButtons).toHaveLength(2);
            });
        });

        it('fetchNotesが正しいユーザーIDで呼ばれる', async () => {
            mockFetchNotes.mockResolvedValue(mockNotes);

            render(<NotesPage />);

            await waitFor(() => {
                expect(mockFetchNotes).toHaveBeenCalledWith('test@example.com');
            });
        });
    });

    describe('空状態の表示', () => {
        beforeEach(() => {
            mockUseSession.mockReturnValue({
                data: mockSession,
                status: 'authenticated',
                update: jest.fn(),
            });
        });

        it('ノートが存在しない場合は空状態メッセージを表示する', async () => {
            mockFetchNotes.mockResolvedValue([]);

            render(<NotesPage />);

            await waitFor(() => {
                expect(screen.getByText('まだノートが作成されていません')).toBeInTheDocument();
            });
        });

        it('空状態では作成ボタンが表示される', async () => {
            mockFetchNotes.mockResolvedValue([]);

            render(<NotesPage />);

            await waitFor(() => {
                expect(screen.getByText('最初のノートを作成')).toBeInTheDocument();
            });
        });

        it('空状態の作成ボタンをクリックすると作成ページに遷移する', async () => {
            mockFetchNotes.mockResolvedValue([]);

            render(<NotesPage />);

            await waitFor(() => {
                const createButton = screen.getByText('最初のノートを作成');
                fireEvent.click(createButton);
            });

            expect(mockPush).toHaveBeenCalledWith('/notes/createNote');
        });
    });

    describe('削除フロー', () => {
        beforeEach(() => {
            mockUseSession.mockReturnValue({
                data: mockSession,
                status: 'authenticated',
                update: jest.fn(),
            });
            mockFetchNotes.mockResolvedValue(mockNotes);
        });

        it('削除ボタンをクリックすると確認ダイアログが表示される', async () => {
            const mockConfirm = jest.spyOn(window, 'confirm').mockReturnValue(false);

            render(<NotesPage />);

            await waitFor(() => {
                const deleteButtons = screen.getAllByText('削除');
                fireEvent.click(deleteButtons[0]);
            });

            expect(mockConfirm).toHaveBeenCalledWith('このノートを削除してもよろしいですか？');

            mockConfirm.mockRestore();
        });

        it('確認ダイアログでキャンセルすると削除されない', async () => {
            const mockConfirm = jest.spyOn(window, 'confirm').mockReturnValue(false);

            render(<NotesPage />);

            await waitFor(() => {
                const deleteButtons = screen.getAllByText('削除');
                fireEvent.click(deleteButtons[0]);
            });

            expect(mockDeleteNote).not.toHaveBeenCalled();

            mockConfirm.mockRestore();
        });

        it('確認ダイアログでOKすると削除が実行される', async () => {
            const mockConfirm = jest.spyOn(window, 'confirm').mockReturnValue(true);
            mockDeleteNote.mockResolvedValue();
            mockFetchNotes
                .mockResolvedValueOnce(mockNotes)
                .mockResolvedValueOnce([mockNotes[1]]); // 削除後は1件のみ

            render(<NotesPage />);

            await waitFor(() => {
                const deleteButtons = screen.getAllByText('削除');
                fireEvent.click(deleteButtons[0]);
            });

            await waitFor(() => {
                expect(mockDeleteNote).toHaveBeenCalledWith(1);
            });

            mockConfirm.mockRestore();
        });

        it('削除成功後にノート一覧が再読み込みされる', async () => {
            const mockConfirm = jest.spyOn(window, 'confirm').mockReturnValue(true);
            mockDeleteNote.mockResolvedValue();
            mockFetchNotes
                .mockResolvedValueOnce(mockNotes)
                .mockResolvedValueOnce([mockNotes[1]]);

            render(<NotesPage />);

            await waitFor(() => {
                const deleteButtons = screen.getAllByText('削除');
                fireEvent.click(deleteButtons[0]);
            });

            await waitFor(() => {
                expect(mockFetchNotes).toHaveBeenCalledTimes(2);
            });

            mockConfirm.mockRestore();
        });

        it('削除失敗時にエラーメッセージが表示される', async () => {
            const mockConfirm = jest.spyOn(window, 'confirm').mockReturnValue(true);
            mockDeleteNote.mockRejectedValue(new Error('削除に失敗しました'));

            render(<NotesPage />);

            await waitFor(() => {
                const deleteButtons = screen.getAllByText('削除');
                fireEvent.click(deleteButtons[0]);
            });

            await waitFor(() => {
                expect(screen.getByText('削除に失敗しました')).toBeInTheDocument();
            });

            mockConfirm.mockRestore();
        });
    });

    describe('エラーハンドリング', () => {
        beforeEach(() => {
            mockUseSession.mockReturnValue({
                data: mockSession,
                status: 'authenticated',
                update: jest.fn(),
            });
        });

        it('ノート一覧の取得失敗時にエラーメッセージが表示される', async () => {
            mockFetchNotes.mockRejectedValue(new Error('データベースに接続できませんでした'));

            render(<NotesPage />);

            await waitFor(() => {
                expect(screen.getByText('データベースに接続できませんでした')).toBeInTheDocument();
            });
        });

        it('エラーメッセージは3秒後に自動的に非表示になる', async () => {
            jest.useFakeTimers();
            mockFetchNotes.mockRejectedValue(new Error('ネットワークエラーが発生しました'));

            render(<NotesPage />);

            await waitFor(() => {
                expect(screen.getByText('ネットワークエラーが発生しました')).toBeInTheDocument();
            });

            // 3秒経過
            jest.advanceTimersByTime(3000);

            await waitFor(() => {
                expect(screen.queryByText('ネットワークエラーが発生しました')).not.toBeInTheDocument();
            });

            jest.useRealTimers();
        });

        it('削除エラー時にもエラーメッセージが表示される', async () => {
            const mockConfirm = jest.spyOn(window, 'confirm').mockReturnValue(true);
            mockFetchNotes.mockResolvedValue(mockNotes);
            mockDeleteNote.mockRejectedValue(new Error('このノートにアクセスする権限がありません'));

            render(<NotesPage />);

            await waitFor(() => {
                const deleteButtons = screen.getAllByText('削除');
                fireEvent.click(deleteButtons[0]);
            });

            await waitFor(() => {
                expect(screen.getByText('このノートにアクセスする権限がありません')).toBeInTheDocument();
            });

            mockConfirm.mockRestore();
        });

        it('エラーメッセージは赤色の背景で表示される', async () => {
            mockFetchNotes.mockRejectedValue(new Error('エラーが発生しました'));

            render(<NotesPage />);

            await waitFor(() => {
                const errorElement = screen.getByText('エラーが発生しました');
                const errorContainer = errorElement.closest('div');
                expect(errorContainer).toHaveClass('bg-red-100');
                expect(errorContainer).toHaveClass('border-red-400');
                expect(errorContainer).toHaveClass('text-red-700');
            });
        });
    });

    describe('ナビゲーション', () => {
        beforeEach(() => {
            mockUseSession.mockReturnValue({
                data: mockSession,
                status: 'authenticated',
                update: jest.fn(),
            });
            mockFetchNotes.mockResolvedValue(mockNotes);
        });

        it('新規作成ボタンをクリックすると作成ページに遷移する', async () => {
            render(<NotesPage />);

            await waitFor(() => {
                const createButton = screen.getByRole('button', { name: '新しいノートを作成' });
                fireEvent.click(createButton);
            });

            expect(mockPush).toHaveBeenCalledWith('/notes/createNote');
        });

        it('編集ボタンをクリックすると編集ページに遷移する', async () => {
            render(<NotesPage />);

            await waitFor(() => {
                const editButtons = screen.getAllByText('編集');
                fireEvent.click(editButtons[0]);
            });

            expect(mockPush).toHaveBeenCalledWith('/notes/edit/1');
        });
    });

    describe('レスポンシブデザイン', () => {
        beforeEach(() => {
            mockUseSession.mockReturnValue({
                data: mockSession,
                status: 'authenticated',
                update: jest.fn(),
            });
            mockFetchNotes.mockResolvedValue(mockNotes);
        });

        it('ノート一覧がグリッドレイアウトで表示される', async () => {
            const { container } = render(<NotesPage />);

            await waitFor(() => {
                const gridContainer = container.querySelector('.grid');
                expect(gridContainer).toBeInTheDocument();
                expect(gridContainer).toHaveClass('grid-cols-1');
                expect(gridContainer).toHaveClass('md:grid-cols-2');
                expect(gridContainer).toHaveClass('lg:grid-cols-3');
            });
        });
    });

    describe('アクセシビリティ', () => {
        beforeEach(() => {
            mockUseSession.mockReturnValue({
                data: mockSession,
                status: 'authenticated',
                update: jest.fn(),
            });
            mockFetchNotes.mockResolvedValue(mockNotes);
        });

        it('新規作成ボタンにaria-labelが設定されている', async () => {
            render(<NotesPage />);

            await waitFor(() => {
                const createButton = screen.getByRole('button', { name: '新しいノートを作成' });
                expect(createButton).toBeInTheDocument();
            });
        });

        it('編集・削除ボタンにaria-labelが設定されている', async () => {
            render(<NotesPage />);

            await waitFor(() => {
                expect(screen.getByLabelText('ノート1を編集')).toBeInTheDocument();
                expect(screen.getByLabelText('ノート1を削除')).toBeInTheDocument();
            });
        });
    });
});
