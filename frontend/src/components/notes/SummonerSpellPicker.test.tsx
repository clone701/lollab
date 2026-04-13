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

    expect(screen.getByAltText('Flash')).toBeInTheDocument();
    expect(screen.getByAltText('Ignite')).toBeInTheDocument();
    expect(screen.getByAltText('Heal')).toBeInTheDocument();
  });

  it('スペルを1つ選択できる', () => {
    render(<SummonerSpellPicker value={[]} onChange={mockOnChange} />);

    const flashButton = screen.getByAltText('Flash').closest('button');
    fireEvent.click(flashButton!);

    expect(mockOnChange).toHaveBeenCalledWith(['SummonerFlash']);
  });

  it('スペルを2つ選択できる', () => {
    render(
      <SummonerSpellPicker value={['SummonerFlash']} onChange={mockOnChange} />
    );

    const igniteButton = screen.getByAltText('Ignite').closest('button');
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

    const healButton = screen.getByAltText('Heal').closest('button');
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

    const flashButton = screen.getByAltText('Flash').closest('button');
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

    const selectedSpells = container.querySelectorAll('.ring-blue-500');
    expect(selectedSpells.length).toBeGreaterThan(0);
  });
});
