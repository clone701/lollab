import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { fetchRuneData, fetchSummonerData } from '@/adapters/game-data';
import runeFixture from '@/lib/game-data/__fixtures__/runes.json';
import summonerFixture from '@/lib/game-data/__fixtures__/summoner.json';
import { RuneTooltipIcon, SpellTooltipIcon } from '..';

// loadOnce のキャッシュがテスト間で残らないよう、adapters をモックする
jest.mock('@/adapters/game-data', () => ({
  fetchItemData: jest.fn(),
  fetchRuneData: jest.fn(),
  fetchSummonerData: jest.fn(),
  fetchChampionData: jest.fn(),
}));

async function openTooltip(label: string): Promise<HTMLElement> {
  fireEvent.focus(screen.getByAltText(label).parentElement as HTMLElement);
  await act(async () => {});
  return screen.getByRole('tooltip');
}

describe('RuneTooltipIcon', () => {
  beforeEach(() => {
    (fetchRuneData as jest.Mock).mockResolvedValue(runeFixture);
  });

  it('ルーン名と説明が出る', async () => {
    render(<RuneTooltipIcon id={8112} src="/a.png" label="ルーン8112" />);
    const tooltip = await openTooltip('ルーン8112');
    expect(within(tooltip).getByText('電撃')).toBeInTheDocument();
    expect(tooltip).toHaveTextContent('アダプティブダメージ');
    expect(tooltip).not.toHaveTextContent('<font');
  });

  it('パスは名前だけが出る', async () => {
    render(<RuneTooltipIcon id={8100} src="/a.png" label="パス8100" />);
    const tooltip = await openTooltip('パス8100');
    expect(tooltip).toHaveTextContent(/^覇道$/);
  });

  it('ステータスシャードなどデータが無い ID は label だけが出る', async () => {
    render(<RuneTooltipIcon id={5001} src="/a.png" label="体力" />);
    const tooltip = await openTooltip('体力');
    expect(tooltip).toHaveTextContent(/^体力$/);
  });

  it('img に title が付かない', () => {
    render(<RuneTooltipIcon id={8112} src="/a.png" label="ルーン8112" />);
    expect(screen.getByAltText('ルーン8112')).not.toHaveAttribute('title');
  });
});

describe('SpellTooltipIcon', () => {
  beforeEach(() => {
    (fetchSummonerData as jest.Mock).mockResolvedValue(summonerFixture);
  });

  it('スペル名・クールダウン・説明が出る', async () => {
    render(<SpellTooltipIcon id={4} src="/a.png" label="スペル4" />);
    const tooltip = await openTooltip('スペル4');
    expect(within(tooltip).getByText('フラッシュ')).toBeInTheDocument();
    expect(within(tooltip).getByText('300 秒')).toBeInTheDocument();
    expect(tooltip).toHaveTextContent('瞬間移動');
  });

  it('img に title が付かない', () => {
    render(<SpellTooltipIcon id={4} src="/a.png" label="スペル4" />);
    expect(screen.getByAltText('スペル4')).not.toHaveAttribute('title');
  });
});
