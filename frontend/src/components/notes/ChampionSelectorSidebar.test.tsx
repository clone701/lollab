/**
 * ChampionSelectorSidebarコンポーネントのテスト
 *
 * 検索機能のテスト（要件: 6.1, 6.2, 6.3, 6.4, 6.5）
 */

import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChampionSelectorSidebar from './ChampionSelectorSidebar';

// Next.js Imageのモック
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

describe('ChampionSelectorSidebar - 検索機能', () => {
  const mockOnMyChampionChange = jest.fn();
  const mockOnEnemyChampionChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('要件6.1: 検索入力欄が表示される', () => {
    render(
      <ChampionSelectorSidebar
        myChampionId={null}
        enemyChampionId={null}
        onMyChampionChange={mockOnMyChampionChange}
        onEnemyChampionChange={mockOnEnemyChampionChange}
      />
    );

    const searchInput = screen.getByPlaceholderText('チャンピオン名で検索...');
    expect(searchInput).toBeInTheDocument();
  });

  test('要件6.2: 入力に応じてリアルタイムでフィルタリングする', () => {
    render(
      <ChampionSelectorSidebar
        myChampionId={null}
        enemyChampionId={null}
        onMyChampionChange={mockOnMyChampionChange}
        onEnemyChampionChange={mockOnEnemyChampionChange}
      />
    );

    const searchInput = screen.getByPlaceholderText('チャンピオン名で検索...');

    // チャンピオン一覧セクションを取得
    const championListSection = screen
      .getByText('チャンピオン一覧')
      .closest('section');
    expect(championListSection).toBeInTheDocument();

    // 初期状態: 全チャンピオンが表示される
    const initialButtons = within(championListSection!).getAllByRole('button');
    expect(initialButtons.length).toBeGreaterThan(100); // 171チャンピオン

    // 検索: "アーリ"
    fireEvent.change(searchInput, { target: { value: 'アーリ' } });

    // フィルタリング後: アーリのみ表示
    const filteredButtons = within(championListSection!).getAllByRole('button');
    expect(filteredButtons.length).toBe(1);
    expect(
      within(championListSection!).getByText('アーリ')
    ).toBeInTheDocument();
  });

  test('要件6.3: 部分一致検索をサポートする', () => {
    render(
      <ChampionSelectorSidebar
        myChampionId={null}
        enemyChampionId={null}
        onMyChampionChange={mockOnMyChampionChange}
        onEnemyChampionChange={mockOnEnemyChampionChange}
      />
    );

    const searchInput = screen.getByPlaceholderText('チャンピオン名で検索...');
    const championListSection = screen
      .getByText('チャンピオン一覧')
      .closest('section');

    // 部分一致検索: "リ"
    fireEvent.change(searchInput, { target: { value: 'リ' } });

    // "アーリ"、"アカリ"、"リー・シン"などが表示される
    expect(
      within(championListSection!).getByText('アーリ')
    ).toBeInTheDocument();
    expect(
      within(championListSection!).getByText('アカリ')
    ).toBeInTheDocument();
    expect(
      within(championListSection!).getByText('リー・シン')
    ).toBeInTheDocument();
  });

  test('要件6.4: 大文字小文字を区別しない検索をサポートする', () => {
    render(
      <ChampionSelectorSidebar
        myChampionId={null}
        enemyChampionId={null}
        onMyChampionChange={mockOnMyChampionChange}
        onEnemyChampionChange={mockOnEnemyChampionChange}
      />
    );

    const searchInput = screen.getByPlaceholderText('チャンピオン名で検索...');
    const championListSection = screen
      .getByText('チャンピオン一覧')
      .closest('section');

    // 小文字で検索
    fireEvent.change(searchInput, { target: { value: 'ahri' } });
    expect(
      within(championListSection!).getByText('アーリ')
    ).toBeInTheDocument();

    // 大文字で検索
    fireEvent.change(searchInput, { target: { value: 'AHRI' } });
    expect(
      within(championListSection!).getByText('アーリ')
    ).toBeInTheDocument();

    // 混在で検索
    fireEvent.change(searchInput, { target: { value: 'AhRi' } });
    expect(
      within(championListSection!).getByText('アーリ')
    ).toBeInTheDocument();
  });

  test('要件6.5: 検索結果が0件の場合、該当するチャンピオンが見つかりませんと表示する', () => {
    render(
      <ChampionSelectorSidebar
        myChampionId={null}
        enemyChampionId={null}
        onMyChampionChange={mockOnMyChampionChange}
        onEnemyChampionChange={mockOnEnemyChampionChange}
      />
    );

    const searchInput = screen.getByPlaceholderText('チャンピオン名で検索...');

    // 存在しないチャンピオン名で検索
    fireEvent.change(searchInput, { target: { value: 'zzzzzzz' } });

    // エラーメッセージが表示される
    expect(
      screen.getByText('該当するチャンピオンが見つかりません')
    ).toBeInTheDocument();
  });

  test('検索クエリをクリアすると全チャンピオンが再表示される', () => {
    render(
      <ChampionSelectorSidebar
        myChampionId={null}
        enemyChampionId={null}
        onMyChampionChange={mockOnMyChampionChange}
        onEnemyChampionChange={mockOnEnemyChampionChange}
      />
    );

    const searchInput = screen.getByPlaceholderText('チャンピオン名で検索...');
    const championListSection = screen
      .getByText('チャンピオン一覧')
      .closest('section');

    // 検索
    fireEvent.change(searchInput, { target: { value: 'アーリ' } });
    let buttons = within(championListSection!).getAllByRole('button');
    expect(buttons.length).toBe(1);

    // クリア
    fireEvent.change(searchInput, { target: { value: '' } });
    buttons = within(championListSection!).getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(100); // 全チャンピオンが再表示
  });
});
