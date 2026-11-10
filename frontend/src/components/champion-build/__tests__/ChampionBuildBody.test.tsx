import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { fetchChampionData, fetchSkillValues } from '@/adapters/game-data';
import urgotFixture from '@/lib/game-data/__fixtures__/urgot.json';
import { getChampionById } from '@/lib/utils/championHelpers';
import type { ChampionBuildResponse } from '@/types/championBuild';
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

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
}));

async function renderBody(
  data: ChampionBuildResponse | null = makeBuildResponse()
): Promise<void> {
  const champion = getChampionById('Urgot');
  if (!champion) throw new Error('champion not found');
  render(
    <ChampionBuildBody
      champion={champion}
      query={{ period: 'latest_patch', queue: 'all', rank: 'all' }}
      data={data}
    >
      <p>読み込み中...</p>
    </ChampionBuildBody>
  );
  await act(async () => {});
}

function isBefore(a: HTMLElement, b: HTMLElement): boolean {
  return Boolean(
    a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING
  );
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

describe('ChampionBuildBody: 並び', () => {
  beforeEach(() => {
    (fetchChampionData as jest.Mock).mockReset();
    (fetchChampionData as jest.Mock).mockResolvedValue(urgotFixture);
    (fetchSkillValues as jest.Mock).mockResolvedValue(null);
  });

  it('基礎情報の後に「ビルドの集計」カード、その後にスキルなどのパネルが並ぶ', async () => {
    await renderBody();
    const info = screen.getByRole('heading', { name: '基礎情報' });
    const card = screen.getByRole('heading', { name: 'ビルドの集計' });
    const skill = screen.getByRole('heading', { name: 'スキル' });
    expect(isBefore(info, card)).toBe(true);
    expect(isBefore(card, skill)).toBe(true);
  });

  it('カードの中に期間・キュー・ランク帯・ロール・概要の値がある', async () => {
    await renderBody();
    const card = within(
      screen
        .getByRole('heading', { name: 'ビルドの集計' })
        .closest('section') as HTMLElement
    );
    expect(card.getByRole('radiogroup', { name: '期間' })).toBeVisible();
    expect(card.getByRole('radiogroup', { name: 'キュー' })).toBeVisible();
    expect(card.getByLabelText('ランク帯')).toBeVisible();
    expect(card.getByRole('navigation', { name: 'ロール' })).toBeVisible();
    expect(card.getByText('勝率')).toBeVisible();
  });

  it('ルーンを2番目にしても、ロールが変わった応答では1番目に戻る', async () => {
    const champion = getChampionById('Urgot')!;
    const query = {
      period: 'latest_patch',
      queue: 'all',
      rank: 'all',
    } as const;
    const { rerender } = render(
      <ChampionBuildBody
        champion={champion}
        query={query}
        data={makeBuildResponse()}
      />
    );
    await userEvent.click(screen.getByRole('radio', { name: /2番目/ }));
    expect(screen.getByRole('radio', { name: /2番目/ })).toHaveAttribute(
      'aria-checked',
      'true'
    );
    rerender(
      <ChampionBuildBody
        champion={champion}
        query={{ ...query, role: 'BOTTOM' }}
        data={makeBuildResponse({ role: 'BOTTOM' })}
      />
    );
    expect(screen.getByRole('radio', { name: /1番目/ })).toHaveAttribute(
      'aria-checked',
      'true'
    );
  });

  it('データが無い間もフィルターは出て、メッセージはカードの下に出る', async () => {
    await renderBody(null);
    const card = screen
      .getByRole('heading', { name: 'ビルドの集計' })
      .closest('section') as HTMLElement;
    expect(
      within(card).getByRole('radiogroup', { name: '期間' })
    ).toBeVisible();
    expect(within(card).queryByText('勝率')).not.toBeInTheDocument();
    expect(isBefore(card, screen.getByText('読み込み中...'))).toBe(true);
    expect(
      screen.queryByRole('heading', { name: 'スキル' })
    ).not.toBeInTheDocument();
  });
});
