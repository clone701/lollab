/**
 * ノート作成ページの統合テスト
 * 
 * このテストは以下の機能を検証します：
 * - ノート作成フローの完全な動作
 * - バリデーションエラーの表示
 * - 保存成功時のリダイレクト
 * - 認証状態の確認
 * - エラーハンドリング
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import CreateNotePage from '../page';
import { createNote } from '@/lib/api/notes';

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
    LoadingContext: React.createContext({
        setLoading: jest.fn(),
    }),
}));

// ChampionSelectorをモック
jest.mock('@/components/notes/ChampionSelector', () => {
    return function MockChampionSelector({
        value,
        onChange,
        label,
    }: {
        value: string | null;
        onChange: (id: string) => void;
        label: string;
    }) {
        return (
            <div data-testid={`champion-selector-${label}`}>
                <label>{label}</label>
                <button
                    onClick={() => onChange('Ahri')}
                    data-testid={`select-champion-${label}`}
                >
                    Select Ahri
                </button>
                {value && <span data-testid={`selected-${label}`}>{value}</span>}
            </div>
        );
    };
});

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockCreateNote = createNote as jest.MockedFunction<typeof createNote>;

describe('CreateNotePage 統合テスト', () => {
    const mockPush = jest.fn();
    const mockSession = {
        user: {
            email: 'test@example.com',
            name: 'Test User',
        },
        expires: '2024-12-31',
    };

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

            const { container } = render(<CreateNotePage />);
            expect(container.firstChild).toBeNull();
        });

        it('未認証の場合はログインページにリダイレクトする', () => {
            mockUseSession.mockReturnValue({
                data: null,
                status: 'unauthenticated',
                update: jest.fn(),
            });

            render(<CreateNotePage />);

            waitFor(() => {
                expect(mockPush).toHaveBeenCalledWith('/api/auth/signin');
            });
        });

        it('認証済みの場合はノート作成フォームを表示する', () => {
            mockUseSession.mockReturnValue({
                data: mockSession,
                status: 'authenticated',
                update: jest.fn(),
            });

            render(<CreateNotePage />);

            expect(screen.getByText('新規ノート作成')).toBeInTheDocument();
            expect(screen.getByText('チャンピオン別の戦略情報を記録しましょう')).toBeInTheDocument();
        });
    });

    describe('ノート作成フロー', () => {
        beforeEach(() => {
            mockUseSession.mockReturnValue({
                data: mockSession,
                status: 'authenticated',
                update: jest.fn(),
            });
        });

        it('汎用ノートを作成できる', async () => {
            mockCreateNote.mockResolvedValue({
                id: 1,
                user_id: 'test@example.com',
                note_type: 'general',
                my_champion_id: 'Ahri',
                enemy_champion_id: null,
                runes: null,
                spells: null,
                items: null,
                memo: 'テスト戦略',
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
            });

            render(<CreateNotePage />);

            // マイチャンピオンを選択
            const selectMyChampion = screen.getByTestId('select-champion-マイチャンピオン');
            fireEvent.click(selectMyChampion);

            // メモを入力
            const textarea = screen.getByLabelText('戦略メモ');
            fireEvent.change(textarea, { target: { value: 'テスト戦略' } });

            // 保存ボタンをクリック
            const submitButton = screen.getByRole('button', { name: '保存' });
            fireEvent.click(submitButton);

            // createNote APIが正しいデータで呼ばれることを確認
            await waitFor(() => {
                expect(mockCreateNote).toHaveBeenCalledWith({
                    user_id: 'test@example.com',
                    note_type: 'general',
                    my_champion_id: 'Ahri',
                    enemy_champion_id: null,
                    runes: null,
                    spells: null,
                    items: null,
                    memo: 'テスト戦略',
                });
            });

            // 成功時にノート一覧ページにリダイレクト
            await waitFor(() => {
                expect(mockPush).toHaveBeenCalledWith('/notes');
            });
        });

        it('対策ノートを作成できる', async () => {
            mockCreateNote.mockResolvedValue({
                id: 2,
                user_id: 'test@example.com',
                note_type: 'matchup',
                my_champion_id: 'Ahri',
                enemy_champion_id: 'Yasuo',
                runes: null,
                spells: null,
                items: null,
                memo: 'Yasuo対策',
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
            });

            render(<CreateNotePage />);

            // 対策ノートに切り替え
            const matchupRadio = screen.getByLabelText('対策ノート');
            fireEvent.click(matchupRadio);

            // マイチャンピオンを選択
            const selectMyChampion = screen.getByTestId('select-champion-マイチャンピオン');
            fireEvent.click(selectMyChampion);

            // 敵チャンピオンを選択
            const selectEnemyChampion = screen.getByTestId('select-champion-敵チャンピオン');
            fireEvent.click(selectEnemyChampion);

            // メモを入力
            const textarea = screen.getByLabelText('戦略メモ');
            fireEvent.change(textarea, { target: { value: 'Yasuo対策' } });

            // 保存ボタンをクリック
            const submitButton = screen.getByRole('button', { name: '保存' });
            fireEvent.click(submitButton);

            // createNote APIが正しいデータで呼ばれることを確認
            await waitFor(() => {
                expect(mockCreateNote).toHaveBeenCalledWith({
                    user_id: 'test@example.com',
                    note_type: 'matchup',
                    my_champion_id: 'Ahri',
                    enemy_champion_id: 'Ahri', // モックでは同じチャンピオンが選択される
                    runes: null,
                    spells: null,
                    items: null,
                    memo: 'Yasuo対策',
                });
            });

            // 成功時にノート一覧ページにリダイレクト
            await waitFor(() => {
                expect(mockPush).toHaveBeenCalledWith('/notes');
            });
        });

        it('空のメモでもノートを作成できる', async () => {
            mockCreateNote.mockResolvedValue({
                id: 3,
                user_id: 'test@example.com',
                note_type: 'general',
                my_champion_id: 'Ahri',
                enemy_champion_id: null,
                runes: null,
                spells: null,
                items: null,
                memo: '',
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
            });

            render(<CreateNotePage />);

            // マイチャンピオンを選択
            const selectMyChampion = screen.getByTestId('select-champion-マイチャンピオン');
            fireEvent.click(selectMyChampion);

            // メモは入力しない

            // 保存ボタンをクリック
            const submitButton = screen.getByRole('button', { name: '保存' });
            fireEvent.click(submitButton);

            // createNote APIが空のメモで呼ばれることを確認
            await waitFor(() => {
                expect(mockCreateNote).toHaveBeenCalledWith(
                    expect.objectContaining({
                        memo: '',
                    })
                );
            });
        });
    });

    describe('バリデーションエラー', () => {
        beforeEach(() => {
            mockUseSession.mockReturnValue({
                data: mockSession,
                status: 'authenticated',
                update: jest.fn(),
            });
        });

        it('マイチャンピオンが未選択の場合、エラーメッセージが表示される', async () => {
            render(<CreateNotePage />);

            // 保存ボタンをクリック（チャンピオン未選択）
            const submitButton = screen.getByRole('button', { name: '保存' });
            fireEvent.click(submitButton);

            // エラーメッセージが表示される
            await waitFor(() => {
                expect(screen.getByText('マイチャンピオンを選択してください')).toBeInTheDocument();
            });

            // createNote APIは呼ばれない
            expect(mockCreateNote).not.toHaveBeenCalled();
        });

        it('対策ノートで敵チャンピオンが未選択の場合、エラーメッセージが表示される', async () => {
            render(<CreateNotePage />);

            // 対策ノートに切り替え
            const matchupRadio = screen.getByLabelText('対策ノート');
            fireEvent.click(matchupRadio);

            // マイチャンピオンのみ選択
            const selectMyChampion = screen.getByTestId('select-champion-マイチャンピオン');
            fireEvent.click(selectMyChampion);

            // 保存ボタンをクリック
            const submitButton = screen.getByRole('button', { name: '保存' });
            fireEvent.click(submitButton);

            // エラーメッセージが表示される
            await waitFor(() => {
                expect(screen.getByText('敵チャンピオンを選択してください')).toBeInTheDocument();
            });

            // createNote APIは呼ばれない
            expect(mockCreateNote).not.toHaveBeenCalled();
        });

        it('バリデーションエラーは赤色の背景で表示される', async () => {
            render(<CreateNotePage />);

            // 保存ボタンをクリック（チャンピオン未選択）
            const submitButton = screen.getByRole('button', { name: '保存' });
            fireEvent.click(submitButton);

            // エラーメッセージが表示される
            await waitFor(() => {
                const errorElement = screen.getByText('マイチャンピオンを選択してください');
                const errorContainer = errorElement.closest('div');
                expect(errorContainer).toHaveClass('bg-red-900');
                expect(errorContainer).toHaveClass('border-red-700');
                expect(errorContainer).toHaveClass('text-red-200');
            });
        });
    });

    describe('保存成功時のリダイレクト', () => {
        beforeEach(() => {
            mockUseSession.mockReturnValue({
                data: mockSession,
                status: 'authenticated',
                update: jest.fn(),
            });
        });

        it('保存成功後にノート一覧ページにリダイレクトする', async () => {
            mockCreateNote.mockResolvedValue({
                id: 1,
                user_id: 'test@example.com',
                note_type: 'general',
                my_champion_id: 'Ahri',
                enemy_champion_id: null,
                runes: null,
                spells: null,
                items: null,
                memo: 'テスト',
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
            });

            render(<CreateNotePage />);

            // マイチャンピオンを選択
            const selectMyChampion = screen.getByTestId('select-champion-マイチャンピオン');
            fireEvent.click(selectMyChampion);

            // 保存ボタンをクリック
            const submitButton = screen.getByRole('button', { name: '保存' });
            fireEvent.click(submitButton);

            // リダイレクトされる
            await waitFor(() => {
                expect(mockPush).toHaveBeenCalledWith('/notes');
            });
        });

        it('リダイレクト前にエラーメッセージが表示されない', async () => {
            mockCreateNote.mockResolvedValue({
                id: 1,
                user_id: 'test@example.com',
                note_type: 'general',
                my_champion_id: 'Ahri',
                enemy_champion_id: null,
                runes: null,
                spells: null,
                items: null,
                memo: 'テスト',
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
            });

            render(<CreateNotePage />);

            // マイチャンピオンを選択
            const selectMyChampion = screen.getByTestId('select-champion-マイチャンピオン');
            fireEvent.click(selectMyChampion);

            // 保存ボタンをクリック
            const submitButton = screen.getByRole('button', { name: '保存' });
            fireEvent.click(submitButton);

            // エラーメッセージが表示されない
            await waitFor(() => {
                expect(mockPush).toHaveBeenCalledWith('/notes');
            });

            expect(screen.queryByText(/エラー/)).not.toBeInTheDocument();
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

        it('保存失敗時にエラーメッセージが表示される', async () => {
            mockCreateNote.mockRejectedValue(new Error('ノートの作成に失敗しました'));

            render(<CreateNotePage />);

            // マイチャンピオンを選択
            const selectMyChampion = screen.getByTestId('select-champion-マイチャンピオン');
            fireEvent.click(selectMyChampion);

            // 保存ボタンをクリック
            const submitButton = screen.getByRole('button', { name: '保存' });
            fireEvent.click(submitButton);

            // エラーメッセージが表示される
            await waitFor(() => {
                expect(screen.getByText('ノートの作成に失敗しました')).toBeInTheDocument();
            });

            // リダイレクトされない
            expect(mockPush).not.toHaveBeenCalled();
        });

        it('データベースエラー時に適切なエラーメッセージが表示される', async () => {
            mockCreateNote.mockRejectedValue(new Error('データベースに接続できませんでした'));

            render(<CreateNotePage />);

            // マイチャンピオンを選択
            const selectMyChampion = screen.getByTestId('select-champion-マイチャンピオン');
            fireEvent.click(selectMyChampion);

            // 保存ボタンをクリック
            const submitButton = screen.getByRole('button', { name: '保存' });
            fireEvent.click(submitButton);

            // エラーメッセージが表示される
            await waitFor(() => {
                expect(screen.getByText('データベースに接続できませんでした')).toBeInTheDocument();
            });
        });

        it('エラーメッセージは3秒後に自動的に非表示になる', async () => {
            jest.useFakeTimers();
            mockCreateNote.mockRejectedValue(new Error('ネットワークエラーが発生しました'));

            render(<CreateNotePage />);

            // マイチャンピオンを選択
            const selectMyChampion = screen.getByTestId('select-champion-マイチャンピオン');
            fireEvent.click(selectMyChampion);

            // 保存ボタンをクリック
            const submitButton = screen.getByRole('button', { name: '保存' });
            fireEvent.click(submitButton);

            // エラーメッセージが表示される
            await waitFor(() => {
                expect(screen.getByText('ネットワークエラーが発生しました')).toBeInTheDocument();
            });

            // 3秒経過
            jest.advanceTimersByTime(3000);

            // エラーメッセージが非表示になる
            await waitFor(() => {
                expect(screen.queryByText('ネットワークエラーが発生しました')).not.toBeInTheDocument();
            });

            jest.useRealTimers();
        });

        it('エラーメッセージは赤色の背景で表示される', async () => {
            mockCreateNote.mockRejectedValue(new Error('エラーが発生しました'));

            render(<CreateNotePage />);

            // マイチャンピオンを選択
            const selectMyChampion = screen.getByTestId('select-champion-マイチャンピオン');
            fireEvent.click(selectMyChampion);

            // 保存ボタンをクリック
            const submitButton = screen.getByRole('button', { name: '保存' });
            fireEvent.click(submitButton);

            // エラーメッセージが表示される
            await waitFor(() => {
                const errorElement = screen.getByText('エラーが発生しました');
                const errorContainer = errorElement.closest('div');
                expect(errorContainer).toHaveClass('bg-red-100');
                expect(errorContainer).toHaveClass('border-red-400');
                expect(errorContainer).toHaveClass('text-red-700');
            });
        });

        it('ユーザー情報が取得できない場合、エラーメッセージが表示される', async () => {
            mockUseSession.mockReturnValue({
                data: {
                    user: {},
                    expires: '2024-12-31',
                },
                status: 'authenticated',
                update: jest.fn(),
            });

            render(<CreateNotePage />);

            // マイチャンピオンを選択
            const selectMyChampion = screen.getByTestId('select-champion-マイチャンピオン');
            fireEvent.click(selectMyChampion);

            // 保存ボタンをクリック
            const submitButton = screen.getByRole('button', { name: '保存' });
            fireEvent.click(submitButton);

            // エラーメッセージが表示される
            await waitFor(() => {
                expect(screen.getByText('ユーザー情報が取得できませんでした')).toBeInTheDocument();
            });

            // createNote APIは呼ばれない
            expect(mockCreateNote).not.toHaveBeenCalled();
        });
    });

    describe('ローディング状態', () => {
        beforeEach(() => {
            mockUseSession.mockReturnValue({
                data: mockSession,
                status: 'authenticated',
                update: jest.fn(),
            });
        });

        it('保存中は保存ボタンが無効化され、テキストが変わる', async () => {
            mockCreateNote.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

            render(<CreateNotePage />);

            // マイチャンピオンを選択
            const selectMyChampion = screen.getByTestId('select-champion-マイチャンピオン');
            fireEvent.click(selectMyChampion);

            // 保存ボタンをクリック
            const submitButton = screen.getByRole('button', { name: '保存' });
            fireEvent.click(submitButton);

            // ローディング中のボタンが表示される
            await waitFor(() => {
                const loadingButton = screen.getByRole('button', { name: '保存中...' });
                expect(loadingButton).toBeDisabled();
            });
        });

        it('保存中はキャンセルボタンが無効化される', async () => {
            mockCreateNote.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

            render(<CreateNotePage />);

            // マイチャンピオンを選択
            const selectMyChampion = screen.getByTestId('select-champion-マイチャンピオン');
            fireEvent.click(selectMyChampion);

            // 保存ボタンをクリック
            const submitButton = screen.getByRole('button', { name: '保存' });
            fireEvent.click(submitButton);

            // キャンセルボタンが無効化される
            await waitFor(() => {
                const cancelButton = screen.getByRole('button', { name: 'キャンセル' });
                expect(cancelButton).toBeDisabled();
            });
        });
    });

    describe('キャンセル機能', () => {
        beforeEach(() => {
            mockUseSession.mockReturnValue({
                data: mockSession,
                status: 'authenticated',
                update: jest.fn(),
            });
        });

        it('キャンセルボタンをクリックするとノート一覧ページに戻る', () => {
            render(<CreateNotePage />);

            const cancelButton = screen.getByRole('button', { name: 'キャンセル' });
            fireEvent.click(cancelButton);

            expect(mockPush).toHaveBeenCalledWith('/notes');
        });

        it('キャンセル時にcreateNote APIは呼ばれない', () => {
            render(<CreateNotePage />);

            const cancelButton = screen.getByRole('button', { name: 'キャンセル' });
            fireEvent.click(cancelButton);

            expect(mockCreateNote).not.toHaveBeenCalled();
        });
    });

    describe('UI要素の表示', () => {
        beforeEach(() => {
            mockUseSession.mockReturnValue({
                data: mockSession,
                status: 'authenticated',
                update: jest.fn(),
            });
        });

        it('ページタイトルが表示される', () => {
            render(<CreateNotePage />);

            expect(screen.getByText('新規ノート作成')).toBeInTheDocument();
        });

        it('説明文が表示される', () => {
            render(<CreateNotePage />);

            expect(screen.getByText('チャンピオン別の戦略情報を記録しましょう')).toBeInTheDocument();
        });

        it('NoteFormコンポーネントが表示される', () => {
            render(<CreateNotePage />);

            // フォームの主要要素が表示されることを確認
            expect(screen.getByLabelText('汎用ノート')).toBeInTheDocument();
            expect(screen.getByLabelText('対策ノート')).toBeInTheDocument();
            expect(screen.getByLabelText('戦略メモ')).toBeInTheDocument();
        });
    });
});
