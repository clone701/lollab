import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { fetchItemData } from '@/adapters/game-data';
import itemFixture from '@/lib/game-data/__fixtures__/item.json';
import { ItemTooltipIcon } from '..';

// loadOnce のキャッシュがテスト間で残らないよう、adapters をモックする
jest.mock('@/adapters/game-data', () => ({
  fetchItemData: jest.fn(),
  fetchRuneData: jest.fn(),
  fetchSummonerData: jest.fn(),
  fetchChampionData: jest.fn(),
}));
const mockFetchItemData = fetchItemData as jest.Mock;

function renderIcon(id: number, label = `アイテム${id}`): HTMLElement {
  render(<ItemTooltipIcon id={id} src="/a.png" label={label} />);
  return screen.getByAltText(label).parentElement as HTMLElement;
}

async function openTooltip(trigger: HTMLElement): Promise<HTMLElement> {
  fireEvent.focus(trigger);
  await act(async () => {});
  return screen.getByRole('tooltip');
}

describe('ItemTooltipIcon', () => {
  beforeEach(() => mockFetchItemData.mockReset());

  it('開くまで fetch せず、img に title が付かない', () => {
    mockFetchItemData.mockResolvedValue(itemFixture);
    renderIcon(3157);
    expect(mockFetchItemData).not.toHaveBeenCalled();
    expect(screen.getByAltText('アイテム3157')).not.toHaveAttribute('title');
  });

  it('開くと名前・合計ゴールド・説明が出て、効果の見出しを区別する', async () => {
    mockFetchItemData.mockResolvedValue(itemFixture);
    const tooltip = await openTooltip(renderIcon(3157));
    expect(within(tooltip).getByText('ゾーニャの砂時計')).toBeInTheDocument();
    expect(within(tooltip).getByText('3,250 ゴールド')).toBeInTheDocument();
    expect(within(tooltip).getByText('時間停止')).toHaveClass('text-highlight');
    // 数値は色付きの要素に分かれる
    expect(within(tooltip).getByText('2.5秒')).toHaveClass('text-game-number');
  });

  it('読み込み中は label だけを出す', async () => {
    mockFetchItemData.mockReturnValue(new Promise(() => {}));
    const tooltip = await openTooltip(renderIcon(3157));
    expect(tooltip).toHaveTextContent(/^アイテム3157$/);
  });

  it('取得に失敗しても label だけを出し、画面は壊れない', async () => {
    mockFetchItemData.mockRejectedValue(new Error('network'));
    const tooltip = await openTooltip(renderIcon(3157));
    expect(tooltip).toHaveTextContent(/^アイテム3157$/);
  });

  it('無い ID は「情報がありません」を出す', async () => {
    mockFetchItemData.mockResolvedValue(itemFixture);
    const tooltip = await openTooltip(renderIcon(9999));
    expect(tooltip).toHaveTextContent('アイテム9999');
    expect(tooltip).toHaveTextContent('情報がありません');
  });
});
