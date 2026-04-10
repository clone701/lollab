import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChampionSelector from '../ChampionSelector';

describe('ChampionSelector', () => {
    const mockOnChange = jest.fn();
    const defaultProps = {
        value: null,
        onChange: mockOnChange,
        label: 'テストラベル',
    };

    beforeEach(() => {
        mockOnChange.mockClear();
    });

    describe('基本表示', () => {
        it('ラベルが正しく表示される', () => {
            render(<ChampionSelector {...defaultProps} />);
            expect(screen.getByText('テストラベル')).toBeInTheDocument();
        });

        it('検索入力欄が表示される', () => {
            render(<ChampionSelector {...defaultProps} />);
            const searchInput = screen.getByPlaceholderText('チャンピオン名で検索...');
            expect(searchInput).toBeInTheDocument();
        });

        it('全チャンピオンが表示される', () => {
            render(<ChampionSelector {...defaultProps} />);
            // 最初の数チャンピオンが表示されることを確認
            expect(screen.getByAltText('Aatrox')).toBeInTheDocument();
            expect(screen.getByAltText('Ahri')).toBeInTheDocument();
        });
    });

    describe('チャンピオン選択機能', () => {
        it('チャンピオンをクリックするとonChangeが呼ばれる', () => {
            render(<ChampionSelector {...defaultProps} />);

            const ahriButton = screen.getByAltText('Ahri').closest('button');
            fireEvent.click(ahriButton!);

            expect(mockOnChange).toHaveBeenCalledTimes(1);
            expect(mockOnChange).toHaveBeenCalledWith('Ahri');
        });

        it('選択されたチャンピオンに選択状態のスタイルが適用される', () => {
            render(<ChampionSelector {...defaultProps} value="Ahri" />);

            const ahriButton = screen.getByAltText('Ahri').closest('button');
            expect(ahriButton).toHaveClass('border-pink-500');
            expect(ahriButton).toHaveClass('ring-2');
            expect(ahriButton).toHaveClass('ring-pink-500');
        });

        it('選択されていないチャンピオンには選択状態のスタイルが適用されない', () => {
            render(<ChampionSelector {...defaultProps} value="Ahri" />);

            const aatroxButton = screen.getByAltText('Aatrox').closest('button');
            expect(aatroxButton).toHaveClass('border-transparent');
        });
    });

    describe('検索フィルター機能', () => {
        it('検索クエリに一致するチャンピオンのみが表示される', () => {
            render(<ChampionSelector {...defaultProps} />);

            const searchInput = screen.getByPlaceholderText('チャンピオン名で検索...');
            fireEvent.change(searchInput, { target: { value: 'Ahri' } });

            // Ahriは表示される
            expect(screen.getByAltText('Ahri')).toBeInTheDocument();

            // Aatroxは表示されない
            expect(screen.queryByAltText('Aatrox')).not.toBeInTheDocument();
        });

        it('検索は大文字小文字を区別しない', () => {
            render(<ChampionSelector {...defaultProps} />);

            const searchInput = screen.getByPlaceholderText('チャンピオン名で検索...');
            fireEvent.change(searchInput, { target: { value: 'ahri' } });

            expect(screen.getByAltText('Ahri')).toBeInTheDocument();
        });

        it('部分一致で検索できる', () => {
            render(<ChampionSelector {...defaultProps} />);

            const searchInput = screen.getByPlaceholderText('チャンピオン名で検索...');
            fireEvent.change(searchInput, { target: { value: 'ah' } });

            // 'ah'を含むチャンピオンが表示される
            expect(screen.getByAltText('Ahri')).toBeInTheDocument();
        });

        it('検索結果が0件の場合、メッセージが表示される', () => {
            render(<ChampionSelector {...defaultProps} />);

            const searchInput = screen.getByPlaceholderText('チャンピオン名で検索...');
            fireEvent.change(searchInput, { target: { value: 'XYZ存在しないチャンピオン' } });

            expect(screen.getByText('該当するチャンピオンが見つかりませんでした')).toBeInTheDocument();
        });

        it('検索クエリをクリアすると全チャンピオンが表示される', () => {
            render(<ChampionSelector {...defaultProps} />);

            const searchInput = screen.getByPlaceholderText('チャンピオン名で検索...');

            // 検索
            fireEvent.change(searchInput, { target: { value: 'Ahri' } });
            expect(screen.queryByAltText('Aatrox')).not.toBeInTheDocument();

            // クリア
            fireEvent.change(searchInput, { target: { value: '' } });
            expect(screen.getByAltText('Aatrox')).toBeInTheDocument();
            expect(screen.getByAltText('Ahri')).toBeInTheDocument();
        });
    });

    describe('アクセシビリティ', () => {
        it('各チャンピオンボタンにaria-labelが設定されている', () => {
            render(<ChampionSelector {...defaultProps} />);

            const ahriButton = screen.getByLabelText('Ahriを選択');
            expect(ahriButton).toBeInTheDocument();
        });

        it('画像にalt属性が設定されている', () => {
            render(<ChampionSelector {...defaultProps} />);

            const ahriImage = screen.getByAltText('Ahri');
            expect(ahriImage).toHaveAttribute('alt', 'Ahri');
        });
    });

    describe('パフォーマンス最適化', () => {
        it('画像にloading="lazy"が設定されている', () => {
            render(<ChampionSelector {...defaultProps} />);

            const ahriImage = screen.getByAltText('Ahri');
            expect(ahriImage).toHaveAttribute('loading', 'lazy');
        });

        it('画像にwidth/height属性が設定されている', () => {
            render(<ChampionSelector {...defaultProps} />);

            const ahriImage = screen.getByAltText('Ahri');
            expect(ahriImage).toHaveAttribute('width', '64');
            expect(ahriImage).toHaveAttribute('height', '64');
        });
    });
});
