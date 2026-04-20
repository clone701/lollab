/**
 * FavoriteChampionsコンポーネントのテスト
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FavoriteChampions from './FavoriteChampions';
import { Champion } from '@/types/champion';

describe('FavoriteChampions', () => {
  const mockChampions: Champion[] = [
    { id: 'Ahri', name: 'アーリ', imagePath: '/images/champion/Ahri.png' },
    { id: 'Zed', name: 'ゼド', imagePath: '/images/champion/Zed.png' },
    { id: 'Yasuo', name: 'ヤスオ', imagePath: '/images/champion/Yasuo.png' },
  ];

  const mockOnSelect = jest.fn();

  beforeEach(() => {
    mockOnSelect.mockClear();
  });

  it('チャンピオンリストを表示する', () => {
    render(
      <FavoriteChampions
        champions={mockChampions}
        selectedId={null}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByAltText('アーリ')).toBeInTheDocument();
    expect(screen.getByAltText('ゼド')).toBeInTheDocument();
    expect(screen.getByAltText('ヤスオ')).toBeInTheDocument();
  });

  it('チャンピオンをクリックするとonSelectが呼ばれる', () => {
    render(
      <FavoriteChampions
        champions={mockChampions}
        selectedId={null}
        onSelect={mockOnSelect}
      />
    );

    const ahriButton = screen.getByLabelText('アーリを選択');
    fireEvent.click(ahriButton);

    expect(mockOnSelect).toHaveBeenCalledWith('Ahri');
    expect(mockOnSelect).toHaveBeenCalledTimes(1);
  });

  it('選択されたチャンピオンにring-2 ring-blackクラスが適用される', () => {
    render(
      <FavoriteChampions
        champions={mockChampions}
        selectedId="Ahri"
        onSelect={mockOnSelect}
      />
    );

    const ahriImage = screen.getByAltText('アーリ');
    expect(ahriImage).toHaveClass('ring-2', 'ring-blue-500');
  });

  it('最大10チャンピオンまで表示する', () => {
    const manyChampions: Champion[] = Array.from({ length: 15 }, (_, i) => ({
      id: `Champion${i}`,
      name: `チャンピオン${i}`,
      imagePath: `/images/champion/Champion${i}.png`,
    }));

    render(
      <FavoriteChampions
        champions={manyChampions}
        selectedId={null}
        onSelect={mockOnSelect}
      />
    );

    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(10);
  });

  it('チャンピオン画像が円形で表示される', () => {
    render(
      <FavoriteChampions
        champions={mockChampions}
        selectedId={null}
        onSelect={mockOnSelect}
      />
    );

    const ahriImage = screen.getByAltText('アーリ');
    expect(ahriImage).toHaveClass('rounded-full');
  });

  it('チャンピオン名が画像下に表示される', () => {
    render(
      <FavoriteChampions
        champions={mockChampions}
        selectedId={null}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('アーリ')).toBeInTheDocument();
    expect(screen.getByText('ゼド')).toBeInTheDocument();
    expect(screen.getByText('ヤスオ')).toBeInTheDocument();
  });
});
