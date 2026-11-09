import { act, fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  fetchItemData,
  fetchRuneData,
  fetchSummonerData,
} from '@/adapters/game-data';
import runeFixture from '@/lib/game-data/__fixtures__/runes.json';
import summonerFixture from '@/lib/game-data/__fixtures__/summoner.json';
import type { RuneConfig } from '@/types/note';
import RuneSelector from '../RuneSelector';
import { SpellItemView } from '../NoteForm/SpellItemView';

// loadOnce のキャッシュがテスト間で残らないよう、adapters をモックする
jest.mock('@/adapters/game-data', () => ({
  fetchItemData: jest.fn(),
  fetchRuneData: jest.fn(),
  fetchSummonerData: jest.fn(),
  fetchChampionData: jest.fn(),
}));

const itemFixture = {
  data: {
    '1055': {
      name: 'ドランブレード',
      description:
        '<mainText><stats>攻撃力 <attention>10</attention></stats></mainText>',
      gold: { total: 450 },
    },
  },
};

const RUNES: RuneConfig = {
  primaryPath: 8100,
  secondaryPath: 8000,
  keystone: 8112,
  primaryRunes: [],
  secondaryRunes: [],
  shards: [],
};

/** マウスを乗せて、開くまでの遅れ（100ms）とデータの読み込みを待つ */
async function hover(trigger: HTMLElement): Promise<void> {
  fireEvent.mouseEnter(trigger);
  await act(async () => {
    jest.advanceTimersByTime(150);
  });
}

beforeEach(() => {
  jest.useFakeTimers();
  (fetchItemData as jest.Mock).mockResolvedValue(itemFixture);
  (fetchRuneData as jest.Mock).mockResolvedValue(runeFixture);
  (fetchSummonerData as jest.Mock).mockResolvedValue(summonerFixture);
});

afterEach(() => jest.useRealTimers());

describe('閲覧モードのスペル・アイテム', () => {
  it('スペルにマウスを乗せると名前・クールダウン・説明が出る', async () => {
    render(<SpellItemView spells={['SummonerFlash']} items={[]} />);
    const img = screen.getByAltText('Flash');
    expect(img).not.toHaveAttribute('title');
    await hover(img.parentElement as HTMLElement);
    const tooltip = screen.getByRole('tooltip');
    expect(within(tooltip).getByText('フラッシュ')).toBeInTheDocument();
    expect(within(tooltip).getByText('300 秒')).toBeInTheDocument();
    expect(tooltip).toHaveTextContent('瞬間移動');
  });

  it('アイテムにマウスを乗せると名前・価格・説明が出る。個数のバッジは残る', async () => {
    render(<SpellItemView spells={[]} items={['1055', '1055']} />);
    const img = screen.getByAltText("Doran's Blade");
    expect(img).not.toHaveAttribute('title');
    expect(screen.getByText('2')).toBeInTheDocument();
    await hover(img.parentElement as HTMLElement);
    const tooltip = screen.getByRole('tooltip');
    expect(within(tooltip).getByText('ドランブレード')).toBeInTheDocument();
    expect(within(tooltip).getByText('450 ゴールド')).toBeInTheDocument();
    expect(tooltip).toHaveTextContent('攻撃力');
  });

  it('マウスを乗せるまでは何も出ない', () => {
    render(<SpellItemView spells={['SummonerFlash']} items={['1055']} />);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});

describe('RuneSelector のツールチップ', () => {
  it('閲覧モード: キーストーンに名前と説明が出る', async () => {
    render(<RuneSelector value={RUNES} onChange={jest.fn()} disabled />);
    const button = screen.getByRole('button', {
      name: 'キーストーン: Electrocute',
    });
    expect(button).toHaveClass('pointer-events-none');
    await hover(button.parentElement as HTMLElement);
    const tooltip = screen.getByRole('tooltip');
    expect(within(tooltip).getByText('電撃')).toBeInTheDocument();
    expect(tooltip).toHaveTextContent('アダプティブダメージ');
  });

  it('閲覧モード: パスに名前が出る。選択済みの見た目は変わらない', async () => {
    render(<RuneSelector value={RUNES} onChange={jest.fn()} disabled />);
    const button = screen.getByRole('button', {
      name: 'メインルーンパス: Domination',
    });
    expect(button).toHaveClass('ring-2', 'ring-accent');
    await hover(button.parentElement as HTMLElement);
    expect(screen.getByRole('tooltip')).toHaveTextContent(/覇道/);
  });

  it('閲覧モード: 未選択のルーンも opacity-50 のままツールチップが出る', async () => {
    render(<RuneSelector value={RUNES} onChange={jest.fn()} disabled />);
    const button = screen.getByRole('button', {
      name: 'メインルーンパス: Sorcery',
    });
    expect(button).toHaveClass('opacity-50');
    await hover(button.parentElement as HTMLElement);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('作成・編集モード: ツールチップが出ず、ボタンを直接押せる', async () => {
    const onChange = jest.fn();
    render(<RuneSelector value={RUNES} onChange={onChange} />);
    const button = screen.getByRole('button', {
      name: 'キーストーン: Electrocute',
    });
    expect(button).not.toHaveClass('pointer-events-none');
    await hover(button);
    await hover(button.parentElement as HTMLElement);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});
