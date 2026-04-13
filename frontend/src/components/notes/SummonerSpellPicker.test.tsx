/**
 * SummonerSpellPickerコンポーネントのテスト
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SummonerSpellPicker from './SummonerSpellPicker';

describe('SummonerSpellPicker', () => {
    const mockOnChange = jest.fn();

    beforeEach(() => {
        mockOnChange.mockClear();
    });

    it('スペルリストを表示する', () => {
        render(<SummonerSpellPicker value={[]} onChange={mockOnChange} />);

        expect(screen.getByAltText('フラッシュ')).toBeInTheDocument();
        expect(screen.getByAltText('イグナイト')).toBeInTheDocument();
        expect(screen.getByAltText('ヒール')).toBeInTheDocument();
    });

    it('スペルを1つ選択できる', () => {
        render(<SummonerSpellPicker value={[]} onChange={mockOnChange} />);

        const flashButton = screen.getByAltText('フラッシュ').closest('button');
        fireEvent.click(flashButton!);

        expect(mockOnChange).toHaveBeenCalledWith(['SummonerFlash']);
    });

    it('スペルを2つ選択できる', () => {
        render(<SummonerSpellPicker value={['SummonerFlash']} onChange={mockOnChange} />);

        const igniteButton = screen.getByAltText('イグナイト').closest('button');
        fireEvent.click(igniteButton!);

        expect(mockOnChange).toHaveBeenCalledWith(['SummonerFlash', 'SummonerDot']);
    });

    it('3つ目のスペルを選択すると最初のスペルが置き換わる', () => {
        render(
            <SummonerSpellPicker
                value={['SummonerFlash', 'SummonerDot']}
                onChange={mockOnChange}
            />
        );

        const healButton = screen.getByAltText('ヒール').closest('button');
        fireEvent.click(healButton!);

        expect(mockOnChange).toHaveBeenCalledWith(['SummonerDot', 'SummonerHeal']);
    });

    it('選択済みスペルをクリックすると選択解除される', () => {
        render(
            <SummonerSpellPicker
                value={['SummonerFlash', 'SummonerDot']}
                onChange={mockOnChange}
            />
        );

        const flashButtons = screen.getAllByAltText('フラッシュ');
        const flashButton = flashButtons[1].closest('button'); // グリッド内のボタンを選択
        fireEvent.click(flashButton!);

        expect(mockOnChange).toHaveBeenCalledWith(['SummonerDot']);
    });

    it('選択済みスペルが表示される', () => {
        const { container } = render(
            <SummonerSpellPicker
                value={['SummonerFlash', 'SummonerDot']}
                onChange={mockOnChange}
            />
        );

        const selectedSpells = container.querySelectorAll('.border-black');
        expect(selectedSpells.length).toBeGreaterThan(0);
    });
});
