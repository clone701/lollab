import { act, render, screen, within } from '@testing-library/react';
import { fetchChampionData } from '@/adapters/game-data';
import urgotFixture from '@/lib/game-data/__fixtures__/urgot.json';
import { element, option } from '../__fixtures__/buildResponse';
import { SkillPanel } from '../SkillPanel';

// loadOnce のキャッシュがテスト間で残らないよう、adapters をモックする
jest.mock('@/adapters/game-data', () => ({
  fetchItemData: jest.fn(),
  fetchRuneData: jest.fn(),
  fetchSummonerData: jest.fn(),
  fetchChampionData: jest.fn(),
}));
const mockFetchChampionData = fetchChampionData as jest.Mock;

const SKILL_ORDER = [1, 2, 3, 1, 1, 4, 1, 2, 1, 2, 4, 2, 2, 3, 3];

async function renderPanel(): Promise<void> {
  render(
    <SkillPanel
      championId="Urgot"
      skillPriority={element([option([1, 2, 3], 80, 40)])}
      skillOrder={element([option(SKILL_ORDER, 50, 25)])}
      mode="most_games"
    />
  );
  await act(async () => {});
}

describe('SkillPanel', () => {
  beforeEach(() => mockFetchChampionData.mockReset());

  it('チャンピオンの id でスキルの JSON を要求する', async () => {
    mockFetchChampionData.mockResolvedValue(urgotFixture);
    await renderPanel();
    expect(mockFetchChampionData).toHaveBeenCalledWith('Urgot');
  });

  it('読み込み前は今の文字の表示で、画像とパッシブは出ない', async () => {
    mockFetchChampionData.mockReturnValue(new Promise(() => {}));
    await renderPanel();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.queryByText('パッシブ')).not.toBeInTheDocument();
    const priority = screen.getByRole('group', { name: 'Q > W > E' });
    expect(priority).toHaveTextContent('Q>W>E');
    expect(screen.getByLabelText('レベル1: Q')).toHaveTextContent('Q');
  });

  it('取得に失敗しても文字の表示のまま壊れない', async () => {
    mockFetchChampionData.mockRejectedValue(new Error('network'));
    await renderPanel();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Q > W > E' })).toBeVisible();
    expect(screen.getByLabelText('レベル6: R')).toBeInTheDocument();
  });

  it('読み込み後は優先順がスキル画像の並びになる', async () => {
    mockFetchChampionData.mockResolvedValue(urgotFixture);
    await renderPanel();
    const priority = within(screen.getByRole('group', { name: 'Q > W > E' }));
    expect(
      priority.getAllByRole('img').map((img) => img.getAttribute('alt'))
    ).toEqual(['コラプトシェル', 'パージ', 'ディスデイン']);
    expect(priority.getAllByText('>')).toHaveLength(2);
  });

  it('スキル欄の頭にパッシブのアイコンが出る', async () => {
    mockFetchChampionData.mockResolvedValue(urgotFixture);
    await renderPanel();
    expect(screen.getByText('パッシブ')).toBeInTheDocument();
    expect(screen.getByAltText('エコーフレイム')).toHaveAttribute(
      'src',
      expect.stringContaining('Urgot_Passive.png')
    );
    expect(screen.getByText('P')).toBeInTheDocument();
  });
});
