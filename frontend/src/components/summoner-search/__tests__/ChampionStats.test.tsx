import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MOCK_CHAMPION_STATS } from '@/lib/summoner-search';
import type { ChampionStatsByQueue } from '@/types/summoner';
import ChampionStats from '../ChampionStats';

function renderStats(
  stats: ChampionStatsByQueue = MOCK_CHAMPION_STATS,
  year: number | null = 2026
): void {
  render(<ChampionStats stats={stats} year={year} />);
}

function rows(): HTMLElement[] {
  return screen.queryAllByRole('listitem');
}

describe('ChampionStats: 見出し', () => {
  it('年があれば「S2026 使用チャンピオン」', () => {
    renderStats(MOCK_CHAMPION_STATS, 2026);
    expect(
      screen.getByRole('heading', { name: 'S2026 使用チャンピオン' })
    ).toBeInTheDocument();
    expect(screen.queryByText('よく使うチャンピオン')).not.toBeInTheDocument();
  });

  it('年がなければ「使用チャンピオン」', () => {
    renderStats(MOCK_CHAMPION_STATS, null);
    expect(
      screen.getByRole('heading', { name: '使用チャンピオン' })
    ).toBeInTheDocument();
  });
});

describe('ChampionStats: タブ', () => {
  it('3つのタブを出し、初期は「全体」を選択する', () => {
    renderStats();
    const group = screen.getByRole('group', { name: 'キュー' });
    expect(
      within(group)
        .getAllByRole('button')
        .map((b) => b.textContent)
    ).toEqual(['全体', 'ソロランク', 'フレックス']);
    const all = screen.getByRole('button', { name: '全体' });
    expect(all).toHaveAttribute('aria-pressed', 'true');
    expect(all).toHaveClass('ring-2', 'ring-accent', 'bg-accent/15');
    expect(screen.getByRole('button', { name: 'ソロランク' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  it('タブを押すと、そのキューの集計に切り替わる', async () => {
    renderStats();
    await userEvent.click(screen.getByRole('button', { name: 'ソロランク' }));
    expect(screen.getByRole('button', { name: 'ソロランク' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: '全体' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
    expect(rows()).toHaveLength(5);
  });

  it('0件のキューは「データがありません」を出す', async () => {
    renderStats();
    await userEvent.click(screen.getByRole('button', { name: 'フレックス' }));
    expect(screen.getByText('データがありません')).toBeInTheDocument();
    expect(rows()).toHaveLength(0);
    expect(screen.queryByText('さらに表示')).not.toBeInTheDocument();
  });
});

describe('ChampionStats: さらに表示', () => {
  it('初めは6件。「さらに表示」で全件になりボタンは消える', async () => {
    renderStats();
    expect(rows()).toHaveLength(6);
    await userEvent.click(screen.getByRole('button', { name: 'さらに表示' }));
    expect(rows()).toHaveLength(7);
    expect(screen.queryByText('さらに表示')).not.toBeInTheDocument();
  });

  it('6件以下ならボタンを出さない', async () => {
    renderStats();
    await userEvent.click(screen.getByRole('button', { name: 'ソロランク' }));
    expect(screen.queryByText('さらに表示')).not.toBeInTheDocument();
  });

  it('タブを変えたら6件に戻す', async () => {
    renderStats();
    await userEvent.click(screen.getByRole('button', { name: 'さらに表示' }));
    await userEvent.click(screen.getByRole('button', { name: 'ソロランク' }));
    await userEvent.click(screen.getByRole('button', { name: '全体' }));
    expect(rows()).toHaveLength(6);
    expect(screen.getByRole('button', { name: 'さらに表示' })).toBeVisible();
  });
});

describe('ChampionStats: 行の表示', () => {
  it('日本語名・CS・KDA の比率と内訳・勝率・試合数を出し、色を付ける', () => {
    renderStats();
    const row = rows()[0];
    expect(within(row).getByText('アーリ')).toBeInTheDocument();
    expect(within(row).getByText('CS 198 (6.9)')).toHaveClass('text-fg-muted');
    expect(within(row).getByText('2.71:1 KDA')).toHaveClass('text-fg-muted');
    expect(within(row).getByText('6.4 / 4.8 / 6.7')).toHaveClass(
      'text-fg-muted'
    );
    expect(within(row).getByText('57 %')).toHaveClass('text-win');
    expect(within(row).getByText('92 試合')).toBeInTheDocument();
    expect(
      within(row).getByRole('img', { name: 'アーリ' })
    ).toBeInTheDocument();
  });

  it('KDA の段階の色と、50% 未満の勝率の色', () => {
    renderStats();
    const [, orianna, syndra, zed] = rows();
    expect(within(orianna).getByText('4.10:1 KDA')).toHaveClass('text-accent');
    expect(within(syndra).getByText('5.20:1 KDA')).toHaveClass(
      'text-highlight'
    );
    expect(within(zed).getByText('3.05:1 KDA')).toHaveClass('text-win');
    expect(within(zed).getByText('47 %')).toHaveClass('text-loss');
  });

  it('旧表示（プログレスバー・勝敗・ゲーム）は出さない', () => {
    renderStats();
    expect(screen.queryByTestId('win-rate-bar')).not.toBeInTheDocument();
    expect(screen.queryByText(/ゲーム/)).not.toBeInTheDocument();
    expect(screen.queryByText(/勝.*敗/)).not.toBeInTheDocument();
  });
});
