import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChampionSearchGrid } from '../ChampionSearchGrid';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn() }),
}));

async function search(text: string): Promise<void> {
  await userEvent.type(screen.getByLabelText('チャンピオンを検索'), text);
}

describe('ChampionSearchGrid', () => {
  beforeEach(() => mockPush.mockReset());

  it('入力前は全チャンピオンをアイコン付きで一覧表示する', () => {
    render(<ChampionSearchGrid />);
    expect(screen.getAllByRole('button').length).toBeGreaterThan(150);
    expect(screen.getByAltText('エイトロックス')).toBeInTheDocument();
  });

  it('一覧は五十音順で、先頭はアーゴット、次はアーリになる', () => {
    render(<ChampionSearchGrid />);
    const alts = screen
      .getAllByRole('img')
      .map((img) => img.getAttribute('alt'));
    expect(alts.slice(0, 2)).toEqual(['アーゴット', 'アーリ']);
  });

  it('日本語名で絞り込める', async () => {
    render(<ChampionSearchGrid />);
    await search('エイトロックス');
    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(screen.getByAltText('エイトロックス')).toBeInTheDocument();
  });

  it('読み（ひらがな）で絞り込める', async () => {
    render(<ChampionSearchGrid />);
    await search('えいとろっくす');
    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(screen.getByAltText('エイトロックス')).toBeInTheDocument();
  });

  it('英語 ID で絞り込め、大文字小文字を区別しない', async () => {
    render(<ChampionSearchGrid />);
    await search('aAtRoX');
    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(screen.getByAltText('エイトロックス')).toBeInTheDocument();
  });

  it('一致するチャンピオンがなければメッセージを表示する', async () => {
    render(<ChampionSearchGrid />);
    await search('zzzzzz');
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(
      screen.getByText('該当するチャンピオンがありません')
    ).toBeInTheDocument();
  });

  it('チャンピオンを選ぶと /champion/{id} へ遷移する', async () => {
    render(<ChampionSearchGrid />);
    await search('aatrox');
    await userEvent.click(screen.getByRole('button'));
    expect(mockPush).toHaveBeenCalledWith('/champion/Aatrox');
  });
});
