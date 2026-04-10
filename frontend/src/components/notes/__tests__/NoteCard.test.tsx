import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import NoteCard from '../NoteCard';
import { ChampionNote } from '@/types/note';

describe('NoteCard', () => {
    const mockOnDelete = jest.fn();
    const mockOnEdit = jest.fn();

    // 汎用ノートのテストデータ
    const generalNote: ChampionNote = {
        id: 1,
        user_id: 'test-user-id',
        note_type: 'general',
        my_champion_id: 'Ahri',
        enemy_champion_id: null,
        runes: null,
        spells: null,
        items: null,
        memo: 'これは汎用ノートのテストメモです。',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-15T12:30:00Z',
    };

    // 対策ノートのテストデータ
    const matchupNote: ChampionNote = {
        id: 2,
        user_id: 'test-user-id',
        note_type: 'matchup',
        my_champion_id: 'Ahri',
        enemy_champion_id: 'Yasuo',
        runes: null,
        spells: null,
        items: null,
        memo: 'これは対策ノートのテストメモです。Yasuoのウィンドウォールに注意。',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-20T15:45:00Z',
    };

    // 長いメモのテストデータ（100文字超）
    const longMemoNote: ChampionNote = {
        id: 3,
        user_id: 'test-user-id',
        note_type: 'general',
        my_champion_id: 'Lux',
        enemy_champion_id: null,
        runes: null,
        spells: null,
        items: null,
        memo: 'これは非常に長いメモのテストです。'.repeat(10), // 150文字以上
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-25T09:15:00Z',
    };

    beforeEach(() => {
        mockOnDelete.mockClear();
        mockOnEdit.mockClear();
    });

    describe('基本表示', () => {
        it('汎用ノートのバッジが正しく表示される', () => {
            render(<NoteCard note={generalNote} onDelete={mockOnDelete} onEdit={mockOnEdit} />);

            const badge = screen.getByText('汎用');
            expect(badge).toBeInTheDocument();
            expect(badge).toHaveClass('bg-blue-600');
        });

        it('対策ノートのバッジが正しく表示される', () => {
            render(<NoteCard note={matchupNote} onDelete={mockOnDelete} onEdit={mockOnEdit} />);

            const badge = screen.getByText('対策');
            expect(badge).toBeInTheDocument();
            expect(badge).toHaveClass('bg-green-600');
        });

        it('マイチャンピオンの画像が表示される', () => {
            render(<NoteCard note={generalNote} onDelete={mockOnDelete} onEdit={mockOnEdit} />);

            const championImage = screen.getByAltText('Ahri');
            expect(championImage).toBeInTheDocument();
            expect(championImage).toHaveAttribute('src', '/images/champion/Ahri.png');
            expect(championImage).toHaveAttribute('width', '48');
            expect(championImage).toHaveAttribute('height', '48');
        });

        it('対策ノートでは敵チャンピオンの画像も表示される', () => {
            render(<NoteCard note={matchupNote} onDelete={mockOnDelete} onEdit={mockOnEdit} />);

            const myChampionImage = screen.getByAltText('Ahri');
            const enemyChampionImage = screen.getByAltText('Yasuo');
            const vsText = screen.getByText('vs');

            expect(myChampionImage).toBeInTheDocument();
            expect(vsText).toBeInTheDocument();
            expect(enemyChampionImage).toBeInTheDocument();
            expect(enemyChampionImage).toHaveAttribute('src', '/images/champion/Yasuo.png');
        });

        it('汎用ノートでは敵チャンピオンの画像が表示されない', () => {
            render(<NoteCard note={generalNote} onDelete={mockOnDelete} onEdit={mockOnEdit} />);

            const vsText = screen.queryByText('vs');
            expect(vsText).not.toBeInTheDocument();
        });

        it('メモのプレビューが表示される', () => {
            render(<NoteCard note={generalNote} onDelete={mockOnDelete} onEdit={mockOnEdit} />);

            expect(screen.getByText('これは汎用ノートのテストメモです。')).toBeInTheDocument();
        });

        it('作成日時が日本語形式で表示される', () => {
            render(<NoteCard note={generalNote} onDelete={mockOnDelete} onEdit={mockOnEdit} />);

            // updated_at: 2024-01-15 → 2024年1月15日
            expect(screen.getByText('2024年1月15日')).toBeInTheDocument();
        });

        it('編集ボタンが表示される', () => {
            render(<NoteCard note={generalNote} onDelete={mockOnDelete} onEdit={mockOnEdit} />);

            const editButton = screen.getByRole('button', { name: /編集/ });
            expect(editButton).toBeInTheDocument();
            expect(editButton).toHaveClass('bg-blue-600');
        });

        it('削除ボタンが表示される', () => {
            render(<NoteCard note={generalNote} onDelete={mockOnDelete} onEdit={mockOnEdit} />);

            const deleteButton = screen.getByRole('button', { name: /削除/ });
            expect(deleteButton).toBeInTheDocument();
            expect(deleteButton).toHaveClass('bg-red-600');
        });
    });

    describe('メモプレビューの切り捨て', () => {
        it('100文字以下のメモはそのまま表示される', () => {
            render(<NoteCard note={generalNote} onDelete={mockOnDelete} onEdit={mockOnEdit} />);

            const memoText = screen.getByText('これは汎用ノートのテストメモです。');
            expect(memoText.textContent).not.toContain('...');
        });

        it('100文字を超えるメモは切り捨てられて"..."が追加される', () => {
            render(<NoteCard note={longMemoNote} onDelete={mockOnDelete} onEdit={mockOnEdit} />);

            const memoElement = screen.getByText(/これは非常に長いメモのテストです。/);
            expect(memoElement.textContent).toContain('...');
            expect(memoElement.textContent!.length).toBeLessThanOrEqual(103); // 100文字 + "..."
        });
    });

    describe('ボタンクリック機能', () => {
        it('編集ボタンをクリックするとonEditが呼ばれる', () => {
            render(<NoteCard note={generalNote} onDelete={mockOnDelete} onEdit={mockOnEdit} />);

            const editButton = screen.getByRole('button', { name: /編集/ });
            fireEvent.click(editButton);

            expect(mockOnEdit).toHaveBeenCalledTimes(1);
            expect(mockOnEdit).toHaveBeenCalledWith(1);
        });

        it('削除ボタンをクリックするとonDeleteが呼ばれる', () => {
            render(<NoteCard note={generalNote} onDelete={mockOnDelete} onEdit={mockOnEdit} />);

            const deleteButton = screen.getByRole('button', { name: /削除/ });
            fireEvent.click(deleteButton);

            expect(mockOnDelete).toHaveBeenCalledTimes(1);
            expect(mockOnDelete).toHaveBeenCalledWith(1);
        });

        it('対策ノートでも編集・削除ボタンが正しく動作する', () => {
            render(<NoteCard note={matchupNote} onDelete={mockOnDelete} onEdit={mockOnEdit} />);

            const editButton = screen.getByRole('button', { name: /編集/ });
            const deleteButton = screen.getByRole('button', { name: /削除/ });

            fireEvent.click(editButton);
            expect(mockOnEdit).toHaveBeenCalledWith(2);

            fireEvent.click(deleteButton);
            expect(mockOnDelete).toHaveBeenCalledWith(2);
        });
    });

    describe('アクセシビリティ', () => {
        it('編集ボタンにaria-labelが設定されている', () => {
            render(<NoteCard note={generalNote} onDelete={mockOnDelete} onEdit={mockOnEdit} />);

            const editButton = screen.getByLabelText('ノート1を編集');
            expect(editButton).toBeInTheDocument();
        });

        it('削除ボタンにaria-labelが設定されている', () => {
            render(<NoteCard note={generalNote} onDelete={mockOnDelete} onEdit={mockOnEdit} />);

            const deleteButton = screen.getByLabelText('ノート1を削除');
            expect(deleteButton).toBeInTheDocument();
        });

        it('チャンピオン画像にalt属性が設定されている', () => {
            render(<NoteCard note={matchupNote} onDelete={mockOnDelete} onEdit={mockOnEdit} />);

            const myChampionImage = screen.getByAltText('Ahri');
            const enemyChampionImage = screen.getByAltText('Yasuo');

            expect(myChampionImage).toHaveAttribute('alt', 'Ahri');
            expect(enemyChampionImage).toHaveAttribute('alt', 'Yasuo');
        });
    });

    describe('スタイリング', () => {
        it('カードに適切なスタイルクラスが適用されている', () => {
            const { container } = render(
                <NoteCard note={generalNote} onDelete={mockOnDelete} onEdit={mockOnEdit} />
            );

            const card = container.firstChild as HTMLElement;
            expect(card).toHaveClass('bg-gray-900');
            expect(card).toHaveClass('rounded-lg');
            expect(card).toHaveClass('p-4');
        });

        it('ホバー時のスタイルクラスが設定されている', () => {
            const { container } = render(
                <NoteCard note={generalNote} onDelete={mockOnDelete} onEdit={mockOnEdit} />
            );

            const card = container.firstChild as HTMLElement;
            expect(card).toHaveClass('hover:border-gray-700');
        });
    });
});
