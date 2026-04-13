import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import NoteForm from '../NoteForm';
import { ChampionNote } from '@/types/note';

describe('NoteForm', () => {
    const mockOnSubmit = jest.fn();
    const mockOnCancel = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('7.1 フォームの基本構造', () => {
        it('ノートタイプ選択UIが表示される', () => {
            render(
                <NoteForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
            );

            expect(screen.getByLabelText('汎用ノート')).toBeInTheDocument();
            expect(screen.getByLabelText('対策ノート')).toBeInTheDocument();
        });

        it('マイチャンピオン選択UIが表示される', () => {
            render(
                <NoteForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
            );

            expect(screen.getByTestId('champion-selector-マイチャンピオン')).toBeInTheDocument();
        });

        it('戦略メモ入力欄が表示される', () => {
            render(
                <NoteForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
            );

            expect(screen.getByLabelText('戦略メモ')).toBeInTheDocument();
        });

        it('保存・キャンセルボタンが表示される', () => {
            render(
                <NoteForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
            );

            expect(screen.getByRole('button', { name: '保存' })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'キャンセル' })).toBeInTheDocument();
        });
    });

    describe('7.2 ノートタイプによる表示切り替え', () => {
        it('汎用ノートの場合、敵チャンピオン選択UIが非表示', () => {
            render(
                <NoteForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
            );

            // デフォルトは汎用ノート
            expect(screen.queryByTestId('champion-selector-敵チャンピオン')).not.toBeInTheDocument();
        });

        it('対策ノートの場合、敵チャンピオン選択UIが表示される', () => {
            render(
                <NoteForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
            );

            // 対策ノートに切り替え
            const matchupRadio = screen.getByLabelText('対策ノート');
            fireEvent.click(matchupRadio);

            expect(screen.getByTestId('champion-selector-敵チャンピオン')).toBeInTheDocument();
        });

        it('ノートタイプを汎用から対策に変更すると敵チャンピオン選択UIが表示される', () => {
            render(
                <NoteForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
            );

            // 最初は非表示
            expect(screen.queryByTestId('champion-selector-敵チャンピオン')).not.toBeInTheDocument();

            // 対策ノートに切り替え
            const matchupRadio = screen.getByLabelText('対策ノート');
            fireEvent.click(matchupRadio);

            // 表示される
            expect(screen.getByTestId('champion-selector-敵チャンピオン')).toBeInTheDocument();
        });
    });

    describe('7.3 フォームバリデーション', () => {
        it('マイチャンピオンが未選択の場合、エラーメッセージが表示される', async () => {
            render(
                <NoteForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
            );

            const submitButton = screen.getByRole('button', { name: '保存' });
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText('マイチャンピオンを選択してください')).toBeInTheDocument();
            });

            expect(mockOnSubmit).not.toHaveBeenCalled();
        });

        it('対策ノートで敵チャンピオンが未選択の場合、エラーメッセージが表示される', async () => {
            render(
                <NoteForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
            );

            // 対策ノートに切り替え
            const matchupRadio = screen.getByLabelText('対策ノート');
            fireEvent.click(matchupRadio);

            // マイチャンピオンのみ選択
            const selectMyChampion = screen.getByTestId('select-champion-マイチャンピオン');
            fireEvent.click(selectMyChampion);

            const submitButton = screen.getByRole('button', { name: '保存' });
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText('敵チャンピオンを選択してください')).toBeInTheDocument();
            });

            expect(mockOnSubmit).not.toHaveBeenCalled();
        });

        it('メモが10,000文字を超える場合、textareaのmaxLengthで制限される', () => {
            render(
                <NoteForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
            );

            const textarea = screen.getByLabelText('戦略メモ') as HTMLTextAreaElement;
            expect(textarea.maxLength).toBe(10000);
        });

        it('バリデーションが成功した場合、onSubmitが呼ばれる', async () => {
            render(
                <NoteForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
            );

            // マイチャンピオンを選択
            const selectMyChampion = screen.getByTestId('select-champion-マイチャンピオン');
            fireEvent.click(selectMyChampion);

            // メモを入力
            const textarea = screen.getByLabelText('戦略メモ');
            fireEvent.change(textarea, { target: { value: 'テスト戦略' } });

            // 送信
            const submitButton = screen.getByRole('button', { name: '保存' });
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(mockOnSubmit).toHaveBeenCalledWith({
                    note_type: 'general',
                    my_champion_id: 'Ahri',
                    enemy_champion_id: null,
                    memo: 'テスト戦略',
                });
            });
        });
    });

    describe('7.4 レスポンシブデザイン', () => {
        it('チャンピオン選択UIがレスポンシブレイアウトを持つ', () => {
            const { container } = render(
                <NoteForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
            );

            // flex-col md:flex-row クラスが適用されているか確認
            const championContainer = container.querySelector('.flex.flex-col.md\\:flex-row');
            expect(championContainer).toBeInTheDocument();
        });
    });

    describe('編集モード', () => {
        const initialValues: Partial<ChampionNote> = {
            note_type: 'matchup',
            my_champion_id: 'Ahri',
            enemy_champion_id: 'Yasuo',
            memo: '既存のメモ',
        };

        it('初期値がフォームに設定される', () => {
            render(
                <NoteForm
                    initialValues={initialValues}
                    onSubmit={mockOnSubmit}
                    onCancel={mockOnCancel}
                    isEditMode={true}
                />
            );

            // ノートタイプ
            const matchupRadio = screen.getByLabelText('対策ノート') as HTMLInputElement;
            expect(matchupRadio.checked).toBe(true);

            // メモ
            const textarea = screen.getByLabelText('戦略メモ') as HTMLTextAreaElement;
            expect(textarea.value).toBe('既存のメモ');
        });

        it('編集モードではノートタイプを変更できない', () => {
            render(
                <NoteForm
                    initialValues={initialValues}
                    onSubmit={mockOnSubmit}
                    onCancel={mockOnCancel}
                    isEditMode={true}
                />
            );

            const generalRadio = screen.getByLabelText('汎用ノート') as HTMLInputElement;
            const matchupRadio = screen.getByLabelText('対策ノート') as HTMLInputElement;

            expect(generalRadio.disabled).toBe(true);
            expect(matchupRadio.disabled).toBe(true);
        });
    });

    describe('ローディング状態', () => {
        it('ローディング中は保存ボタンが無効化される', () => {
            render(
                <NoteForm
                    onSubmit={mockOnSubmit}
                    onCancel={mockOnCancel}
                    loading={true}
                />
            );

            const submitButton = screen.getByRole('button', { name: '保存中...' });
            expect(submitButton).toBeDisabled();
        });

        it('ローディング中はキャンセルボタンが無効化される', () => {
            render(
                <NoteForm
                    onSubmit={mockOnSubmit}
                    onCancel={mockOnCancel}
                    loading={true}
                />
            );

            const cancelButton = screen.getByRole('button', { name: 'キャンセル' });
            expect(cancelButton).toBeDisabled();
        });

        it('ローディング中はテキストエリアが無効化される', () => {
            render(
                <NoteForm
                    onSubmit={mockOnSubmit}
                    onCancel={mockOnCancel}
                    loading={true}
                />
            );

            const textarea = screen.getByLabelText('戦略メモ') as HTMLTextAreaElement;
            expect(textarea.disabled).toBe(true);
        });
    });

    describe('キャンセル機能', () => {
        it('キャンセルボタンをクリックするとonCancelが呼ばれる', () => {
            render(
                <NoteForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
            );

            const cancelButton = screen.getByRole('button', { name: 'キャンセル' });
            fireEvent.click(cancelButton);

            expect(mockOnCancel).toHaveBeenCalledTimes(1);
        });
    });
});
