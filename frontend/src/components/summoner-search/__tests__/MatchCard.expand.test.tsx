import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MatchDetailProvider } from '@/components/match-detail';
import { fetchMatchDetail } from '@/adapters/api';
import { makeMatchDetail } from '@/lib/match-detail/__fixtures__/matchDetail';
import { MOCK_MATCHES } from '@/lib/summoner-search';
import MatchHistory from '../MatchHistory';

jest.mock('@/adapters/api', () => ({
  ...jest.requireActual('@/adapters/api'),
  fetchMatchDetail: jest.fn(),
}));

// ビルドのタブを開いてもスキルの JSON は読み込まれない状態（文字の表示）にする
jest.mock('@/adapters/game-data', () => ({
  fetchChampionData: jest.fn(() => new Promise(() => {})),
  fetchSkillValues: jest.fn(() => new Promise(() => {})),
}));
const mockFetch = jest.mocked(fetchMatchDetail);

function renderHistory(matchCount = 1): void {
  render(
    <MatchDetailProvider>
      <MatchHistory
        matches={MOCK_MATCHES.slice(0, matchCount)}
        puuid="puuid-1"
        region="JP"
      />
    </MatchDetailProvider>
  );
}

function expandButtons(): HTMLElement[] {
  return screen.getAllByRole('button', { name: /^詳細を(展開|閉じる)$/ });
}

describe('MatchCard: 展開と折りたたみ', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockResolvedValue(makeMatchDetail());
  });

  it('閉じている間は展開ボタンだけで、試合詳細を取得しない', () => {
    renderHistory();
    const button = expandButtons()[0];
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveAccessibleName('詳細を展開');
    expect(screen.queryByRole('region', { name: '試合詳細' })).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('押すとカードの下に試合詳細を出し、ボタンの向きを反転する', async () => {
    renderHistory();
    await userEvent.click(expandButtons()[0]);

    expect(mockFetch).toHaveBeenCalledWith('KR_1', expect.anything());
    expect(await screen.findByRole('tab', { name: '概要' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    const button = expandButtons()[0];
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(button).toHaveAccessibleName('詳細を閉じる');
    expect(screen.getByTestId('expand-icon')).toHaveClass('rotate-180');
    expect(button).toHaveAttribute('aria-controls', 'match-detail-KR_1');
    expect(document.getElementById('match-detail-KR_1')).not.toBeNull();
  });

  it('取得中は読み込み中を表示する', async () => {
    mockFetch.mockReturnValue(new Promise(() => {}));
    renderHistory();
    await userEvent.click(expandButtons()[0]);
    expect(screen.getByRole('status')).toHaveTextContent('読み込み中');
  });

  it('もう一度押すと閉じ、開き直しても読み込み直さない', async () => {
    renderHistory();
    await userEvent.click(expandButtons()[0]);
    await screen.findByRole('tab', { name: '概要' });

    await userEvent.click(expandButtons()[0]);
    expect(screen.queryByRole('tab', { name: '概要' })).toBeNull();
    expect(expandButtons()[0]).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByTestId('expand-icon')).not.toHaveClass('rotate-180');

    await userEvent.click(expandButtons()[0]);
    expect(screen.getByRole('tab', { name: '概要' })).toBeInTheDocument();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('複数の試合を同時に展開できる', async () => {
    renderHistory(2);
    const [first, second] = expandButtons();
    await userEvent.click(first);
    await userEvent.click(second);
    await waitFor(() =>
      expect(screen.getAllByRole('tab', { name: '概要' })).toHaveLength(2)
    );
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch.mock.calls.map((c) => c[0])).toEqual(['KR_1', 'KR_2']);
  });

  it('概要とビルドのタブを切り替えられる', async () => {
    renderHistory();
    await userEvent.click(expandButtons()[0]);
    await userEvent.click(await screen.findByRole('tab', { name: 'ビルド' }));
    expect(screen.getByRole('tab', { name: 'ビルド' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(screen.getByText('アイテムの購入順')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: '概要' }));
    expect(screen.getByText('合計キル')).toBeInTheDocument();
  });
});

describe('MatchCard: 取得の失敗', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('429 のメッセージと再試行ボタンを出し、再試行で取り直す', async () => {
    mockFetch.mockRejectedValueOnce(
      new Error('しばらくしてから再試行してください')
    );
    mockFetch.mockResolvedValueOnce(makeMatchDetail());
    renderHistory();
    await userEvent.click(expandButtons()[0]);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'しばらくしてから再試行してください'
    );
    await userEvent.click(screen.getByRole('button', { name: '再試行' }));
    expect(
      await screen.findByRole('tab', { name: '概要' })
    ).toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('それ以外の失敗は「試合詳細を取得できませんでした」と再試行ボタンを出す', async () => {
    mockFetch.mockRejectedValue(new Error('試合詳細を取得できませんでした'));
    renderHistory();
    await userEvent.click(expandButtons()[0]);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      '試合詳細を取得できませんでした'
    );
    expect(screen.getByRole('button', { name: '再試行' })).toBeInTheDocument();
  });

  it('失敗は保存せず、閉じて開き直すと取り直す', async () => {
    mockFetch.mockRejectedValueOnce(
      new Error('試合詳細を取得できませんでした')
    );
    mockFetch.mockResolvedValueOnce(makeMatchDetail());
    renderHistory();
    await userEvent.click(expandButtons()[0]);
    await screen.findByRole('alert');
    await userEvent.click(expandButtons()[0]);
    await userEvent.click(expandButtons()[0]);
    expect(
      await screen.findByRole('tab', { name: '概要' })
    ).toBeInTheDocument();
  });
});
