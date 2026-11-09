import { act, render, screen, within } from '@testing-library/react';
import { fetchChampionData, fetchSkillValues } from '@/adapters/game-data';
import urgotFixture from '@/lib/game-data/__fixtures__/urgot.json';
import { getChampionById } from '@/lib/utils/championHelpers';
import { makeBuildResponse } from '../__fixtures__/buildResponse';
import { ChampionBuildBody } from '../ChampionBuildBody';

// loadOnce のキャッシュがテスト間で残らないよう、adapters をモックする
jest.mock('@/adapters/game-data', () => ({
  fetchItemData: jest.fn(),
  fetchRuneData: jest.fn(),
  fetchSummonerData: jest.fn(),
  fetchChampionData: jest.fn(),
  fetchSkillValues: jest.fn(),
}));
const mockFetchChampionData = fetchChampionData as jest.Mock;
const mockFetchSkillValues = fetchSkillValues as jest.Mock;

async function renderBody(): Promise<void> {
  const champion = getChampionById('Urgot');
  if (!champion) throw new Error('champion not found');
  render(
    <ChampionBuildBody
      champion={champion}
      query={{ period: 'latest_patch', queue: 'all', rank: 'all' }}
      data={makeBuildResponse()}
      mode="most_games"
    />
  );
  await act(async () => {});
}

describe('ChampionBuildBody: 基礎情報とスキルのデータ', () => {
  beforeEach(() => {
    mockFetchChampionData.mockReset();
    mockFetchSkillValues.mockReset();
    mockFetchSkillValues.mockResolvedValue(null);
  });

  it('チャンピオンの JSON と数値入りのファイルを1回ずつだけ要求する', async () => {
    mockFetchChampionData.mockResolvedValue(urgotFixture);
    await renderBody();
    expect(mockFetchChampionData).toHaveBeenCalledTimes(1);
    expect(mockFetchChampionData).toHaveBeenCalledWith('Urgot');
    expect(mockFetchSkillValues).toHaveBeenCalledTimes(1);
    expect(mockFetchSkillValues).toHaveBeenCalledWith('Urgot');
  });

  it('同じデータで基礎情報とスキルのパネルの両方にスキル画像が出る', async () => {
    mockFetchChampionData.mockResolvedValue(urgotFixture);
    await renderBody();
    expect(screen.getByRole('heading', { name: '基礎情報' })).toBeVisible();
    const skillSection = screen
      .getByRole('heading', { name: 'スキル' })
      .closest('section') as HTMLElement;
    expect(within(skillSection).getAllByAltText('エコーフレイム')).toHaveLength(
      1
    );
    expect(screen.getAllByAltText('エコーフレイム')).toHaveLength(2);
  });

  it('読み込み前は基礎情報が出ず、スキルは文字の表示のまま', async () => {
    mockFetchChampionData.mockReturnValue(new Promise(() => {}));
    await renderBody();
    expect(
      screen.queryByRole('heading', { name: '基礎情報' })
    ).not.toBeInTheDocument();
    expect(screen.queryByAltText('エコーフレイム')).toBeNull();
    expect(screen.getByRole('group', { name: 'Q > W > E' })).toBeVisible();
  });
});
