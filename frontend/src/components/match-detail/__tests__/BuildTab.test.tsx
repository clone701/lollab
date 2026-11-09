import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  SAMPLE_BUILD,
  TARGET_PUUID,
  makeMatchDetail,
} from '@/lib/match-detail/__fixtures__/matchDetail';
import { fetchChampionData } from '@/adapters/game-data';
import monkeyKingFixture from '@/lib/game-data/__fixtures__/monkeyKing.json';
import urgotFixture from '@/lib/game-data/__fixtures__/urgot.json';
import type { MatchDetailResponse } from '@/types/matchDetail';
import { BuildTab } from '../build';

// loadOnce のキャッシュがテスト間で残らないよう、adapters をモックする
jest.mock('@/adapters/game-data', () => ({
  fetchItemData: jest.fn(),
  fetchRuneData: jest.fn(),
  fetchSummonerData: jest.fn(),
  fetchChampionData: jest.fn(),
}));
const mockFetchChampionData = fetchChampionData as jest.Mock;

// 既定はスキルの JSON が読み込まれない状態（文字の表示）
beforeEach(() => {
  mockFetchChampionData.mockReset();
  mockFetchChampionData.mockReturnValue(new Promise(() => {}));
});

function renderBuild(match: MatchDetailResponse = makeMatchDetail()): void {
  render(<BuildTab match={match} targetPuuid={TARGET_PUUID} />);
}

describe('BuildTab: プレイヤーの切り替え', () => {
  it('初期表示は対象プレイヤーのビルド', () => {
    renderBuild();
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(
      'Player1エイトロックス'
    );
    expect(
      screen.getByRole('button', { name: 'エイトロックス（Player1）' })
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it('10人のアイコンから、ほかのプレイヤーに切り替えられる', async () => {
    renderBuild();
    expect(screen.getAllByRole('button')).toHaveLength(10);
    await userEvent.click(
      screen.getByRole('button', { name: 'ジンクス（Player4）' })
    );
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(
      'Player4ジンクス'
    );
    expect(
      screen.getByRole('button', { name: 'ジンクス（Player4）' })
    ).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByRole('button', { name: 'エイトロックス（Player1）' })
    ).toHaveAttribute('aria-pressed', 'false');
  });

  it('対象プレイヤーがいなければ先頭の1人を表示する', () => {
    render(<BuildTab match={makeMatchDetail()} targetPuuid="none" />);
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(
      'Player6'
    );
  });
});

describe('BuildTab: アイテムとスキル', () => {
  it('アイテムの購入順を分ごとのまとまりで「>」でつなぎ、下に「N分」を出す', () => {
    renderBuild();
    expect(screen.getByText('0分')).toBeInTheDocument();
    expect(screen.getByText('6分')).toBeInTheDocument();
    expect(screen.getByText('12分')).toBeInTheDocument();
    const section = screen
      .getByRole('heading', { name: 'アイテムの購入順' })
      .closest('section') as HTMLElement;
    expect(within(section).getAllByText('>')).toHaveLength(2);
    expect(screen.getAllByAltText(/^アイテム/)).toHaveLength(5);
  });

  it('スキルは最大化の順とレベルごとの Q/W/E/R を出し、R を強調する', () => {
    renderBuild();
    expect(screen.getByRole('group', { name: 'Q > W > E' })).toBeVisible();
    const levels = screen.getAllByLabelText(/^レベル\d+: /);
    expect(levels.map((l) => l.textContent).join('')).toBe('QWEQQRQW');
    const r = screen.getByLabelText('レベル6: R');
    expect(r).toHaveClass('text-highlight', 'font-bold');
    expect(screen.getByLabelText('レベル1: Q')).not.toHaveClass(
      'text-highlight'
    );
  });

  it('build が null ならアイテムとスキルは「データなし」、ルーンは表示する', async () => {
    const match = makeMatchDetail();
    match.participants[0] = { ...match.participants[0], build: null };
    renderBuild(match);
    expect(screen.getAllByText('データなし')).toHaveLength(2);
    expect(screen.queryByText('0分')).not.toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'メイン' })).toBeInTheDocument();
    expect(screen.getByAltText('Conqueror')).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: 'リー・シン（Player2）' })
    );
    expect(screen.queryByText('データなし')).not.toBeInTheDocument();
  });
});

function selectedAlts(group: string): string[] {
  return within(screen.getByRole('group', { name: group }))
    .getAllByRole('img')
    .filter((img) => img.closest('[data-selected="true"]'))
    .map((img) => img.getAttribute('alt') ?? '');
}

describe('BuildTab: ルーン', () => {
  it('メイン・サブのツリーの全ルーンを並べ、選んだものだけ不透明にする', () => {
    renderBuild();
    expect(selectedAlts('メイン')).toEqual([
      'Conqueror',
      'Triumph',
      'Legend: Alacrity',
      'Coup de Grace',
    ]);
    expect(selectedAlts('サブ')).toEqual(['Taste of Blood', 'Treasure Hunter']);
    // 選ばなかったルーンも薄く並ぶ
    const other = screen.getByAltText('Press the Attack');
    expect(other.closest('[data-selected]')).toHaveAttribute(
      'data-selected',
      'false'
    );
    expect(other.closest('[data-selected]')).toHaveClass('opacity-30');
    expect(
      screen.getByAltText('Conqueror').closest('[data-selected]')
    ).toHaveClass('opacity-100');
  });

  it('シャードは3行で、同じシャードが複数行にあっても選んだ行だけ強調する', () => {
    renderBuild();
    const shards = within(screen.getByRole('group', { name: 'シャード' }));
    expect(selectedAlts('シャード')).toEqual([
      'Adaptive Force',
      'Move Speed',
      'Health',
    ]);
    // Adaptive Force は攻撃・柔軟の2行にあり、選んだのは攻撃の行だけ
    const adaptive = shards.getAllByAltText('Adaptive Force');
    expect(adaptive).toHaveLength(2);
    expect(adaptive[0].closest('[data-selected]')).toHaveAttribute(
      'data-selected',
      'true'
    );
    expect(adaptive[1].closest('[data-selected]')).toHaveAttribute(
      'data-selected',
      'false'
    );
  });
});

describe('BuildTab: スキル画像', () => {
  it('読み込み前は文字の表示で、画像は出ない', () => {
    renderBuild();
    expect(mockFetchChampionData).toHaveBeenCalledWith('Aatrox');
    expect(screen.queryByAltText('コラプトシェル')).not.toBeInTheDocument();
    expect(screen.getByLabelText('レベル1: Q')).toHaveTextContent('Q');
  });

  it('取得に失敗しても文字の表示のまま壊れない', async () => {
    mockFetchChampionData.mockRejectedValue(new Error('network'));
    renderBuild();
    await act(async () => {});
    expect(screen.queryByAltText('コラプトシェル')).not.toBeInTheDocument();
    expect(screen.getByLabelText('レベル6: R')).toHaveTextContent('R');
  });

  it('読み込み後は最大化の順とレベルごとのマスがスキル画像になり、R の強調は残る', async () => {
    mockFetchChampionData.mockResolvedValue(urgotFixture);
    renderBuild();
    await act(async () => {});
    const priority = within(screen.getByRole('group', { name: 'Q > W > E' }));
    expect(priority.getAllByRole('img')).toHaveLength(3);
    const levels = screen.getAllByLabelText(/^レベル\d+: /);
    expect(levels.map((l) => l.textContent).join('')).toBe('QWEQQRQW');
    const r = screen.getByLabelText('レベル6: R');
    expect(within(r).getByAltText('デスグラインダー')).toBeInTheDocument();
    expect(r).toHaveClass('text-highlight', 'font-bold', 'ring-highlight');
    expect(
      within(screen.getByLabelText('レベル1: Q')).getByAltText('コラプトシェル')
    ).toBeInTheDocument();
  });

  it('ウーコン（MonkeyKing）でも画像が出る', async () => {
    mockFetchChampionData.mockResolvedValue(monkeyKingFixture);
    render(<BuildTab match={makeMatchDetail()} targetPuuid="puuid-8" />);
    await act(async () => {});
    expect(mockFetchChampionData).toHaveBeenCalledWith('Wukong');
    expect(
      within(screen.getByLabelText('レベル1: Q')).getByAltText('強棒打')
    ).toHaveAttribute(
      'src',
      expect.stringContaining('MonkeyKingDoubleAttack.png')
    );
  });

  it('skill_order が空ならスキルの JSON を要求しない', () => {
    const match = makeMatchDetail();
    match.participants[0] = {
      ...match.participants[0],
      build: { ...SAMPLE_BUILD, skill_order: [] },
    };
    renderBuild(match);
    expect(mockFetchChampionData).not.toHaveBeenCalled();
  });
});
