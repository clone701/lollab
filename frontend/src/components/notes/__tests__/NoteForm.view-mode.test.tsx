import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import NoteForm from '../NoteForm';

// 子コンポーネントをモック
jest.mock('../RuneSelector', () => {
    return function MockRuneSelector({ disabled }: { disabled?: boolean }) {
        return <div data-testid="rune-selector" data-disabled={disabled}>RuneSelector</div>;
    };
});

jest.mock('../SummonerSpellPicker', () => {
    return function MockSummonerSpellPicker({ disabled }: { disabled?: boolean }) {
        return <div data-testid="spell-picker" data-disabled={disabled}>SummonerSpellPicker</div>;
    };
});

jest.mock('../ItemBuildSelector', () => {
    return function MockItemBuildSelector({ disabled }: { disabled?: boolean }) {
        return <div data-testid="item-selector" data-disabled={disabled}>ItemBuildSelector</div>;
    };
});

jest.mock('@/components/ui/Toast', () => {
    return function MockToast() {
        return null;
    };
});

jest.mock('@/lib/hooks/useToast', () => {
    return function useToast() {
        return {
            toast: null,
            showToast: jest.fn(),
            hideToast: jest.fn(),
        };
    };
});

jest.mock('@/lib/utils/championHelpers', () => ({
    getChampionById: jest.fn(() => ({ name: 'TestChampion' })),
}));

describe('NoteForm - View Mode (Task 3.2)', () => {
    const mockProps = {
        mode: 'view' as const,
        myChampionId: 'Ahri',
        enemyChampionId: 'Yasuo',
        onCancel: jest.fn(),
        onSave: jest.fn(),
        onEdit: jest.fn(),
        onDelete: jest.fn(),
    };

    it('プリセット名入力欄がdisabledになる', () => {
        render(<NoteForm {...mockProps} />);

        const input = screen.getByLabelText(/プリセット名/);
        expect(input).toBeDisabled();
        expect(input).toHaveClass('bg-gray-50', 'cursor-not-allowed');
    });

    it('対策メモ入力欄がdisabledになる', () => {
        render(<NoteForm {...mockProps} />);

        const textarea = screen.getByLabelText('対策メモ');
        expect(textarea).toBeDisabled();
        expect(textarea).toHaveClass('bg-gray-50', 'cursor-not-allowed');
    });

    it('RuneSelectorにdisabled=trueが渡される', () => {
        render(<NoteForm {...mockProps} />);

        const runeSelector = screen.getByTestId('rune-selector');
        expect(runeSelector).toHaveAttribute('data-disabled', 'true');
    });

    it('SummonerSpellPickerにdisabled=trueが渡される', () => {
        render(<NoteForm {...mockProps} />);

        const spellPicker = screen.getByTestId('spell-picker');
        expect(spellPicker).toHaveAttribute('data-disabled', 'true');
    });

    it('ItemBuildSelectorにdisabled=trueが渡される', () => {
        render(<NoteForm {...mockProps} />);

        const itemSelector = screen.getByTestId('item-selector');
        expect(itemSelector).toHaveAttribute('data-disabled', 'true');
    });

    it('リセットボタンが表示されない', () => {
        render(<NoteForm {...mockProps} />);

        const resetButtons = screen.queryAllByText('リセット');
        expect(resetButtons).toHaveLength(0);
    });
});

describe('NoteForm - Edit Mode (Task 3.2)', () => {
    const mockProps = {
        mode: 'edit' as const,
        myChampionId: 'Ahri',
        enemyChampionId: 'Yasuo',
        onCancel: jest.fn(),
        onSave: jest.fn(),
    };

    it('プリセット名入力欄がdisabledにならない', () => {
        render(<NoteForm {...mockProps} />);

        const input = screen.getByLabelText(/プリセット名/);
        expect(input).not.toBeDisabled();
        expect(input).not.toHaveClass('bg-gray-50', 'cursor-not-allowed');
    });

    it('対策メモ入力欄がdisabledにならない', () => {
        render(<NoteForm {...mockProps} />);

        const textarea = screen.getByLabelText('対策メモ');
        expect(textarea).not.toBeDisabled();
        expect(textarea).not.toHaveClass('bg-gray-50', 'cursor-not-allowed');
    });

    it('RuneSelectorにdisabled=falseが渡される', () => {
        render(<NoteForm {...mockProps} />);

        const runeSelector = screen.getByTestId('rune-selector');
        expect(runeSelector).toHaveAttribute('data-disabled', 'false');
    });

    it('リセットボタンが表示される', () => {
        render(<NoteForm {...mockProps} />);

        const resetButtons = screen.queryAllByText('リセット');
        expect(resetButtons.length).toBeGreaterThan(0);
    });
});
