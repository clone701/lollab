import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchResultPage from '@/components/summoner-search/SearchResultPage';
import { makeMatchDetail } from '@/lib/match-detail/__fixtures__/matchDetail';
import { MOCK_MATCHES, MOCK_SUMMONER } from '@/lib/summoner-search';
import type { SummonerDetail } from '@/types/summoner';

jest.mock('@/lib/contexts/AuthContext', () => ({
  useAuth: () => ({ user: null }),
}));
jest.mock('@/adapters/supabase/favorites', () => ({
  isFavorite: jest.fn(),
  addFavorite: jest.fn(),
  removeFavorite: jest.fn(),
  fetchFavorites: jest.fn(),
}));

const mockFetch = jest.fn();

const DETAIL: SummonerDetail = {
  summoner: { ...MOCK_SUMMONER, puuid: 'puuid-1' },
  rankPosition: null,
  matches: MOCK_MATCHES.slice(0, 1),
  championStats: { all: [], solo: [], flex: [] },
  championStatsYear: 2026,
};

function jsonResponse(body: unknown): Response {
  return { ok: true, status: 200, json: async () => body } as Response;
}

function matchDetailCalls(): number {
  return mockFetch.mock.calls.filter(([url]) =>
    String(url).includes('/api/match/')
  ).length;
}

function renderPage(query: string) {
  const ui = (q: string) => (
    <SearchResultPage query={q} region="JP" onSearch={() => {}} />
  );
  const view = render(ui(query));
  return { rerenderWith: (q: string) => view.rerender(ui(q)) };
}

describe('SearchResultPage: 試合詳細', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockImplementation(async (url: string) =>
      jsonResponse(
        String(url).includes('/api/match/') ? makeMatchDetail() : DETAIL
      )
    );
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  it('検索したサモナーの PUUID の行を強調し、名前は検索中の region でリンクする', async () => {
    renderPage('a#JP1');
    await userEvent.click(
      await screen.findByRole('button', { name: '詳細を展開' })
    );
    const row = (await screen.findByText('Player1')).closest('li');
    expect(row).toHaveAttribute('data-target', 'true');
    expect(row).toHaveClass('border-l-2', 'border-accent', 'bg-accent/15');
    expect(
      within(row as HTMLElement).getByRole('link', { name: 'Player1' })
    ).toHaveAttribute('href', '/?region=JP&q=Player1%23T1');
  });

  it('別のサモナーを検索するとキャッシュが消え、同じ試合でも取り直す', async () => {
    const { rerenderWith } = renderPage('a#JP1');
    const open = async () =>
      userEvent.click(
        await screen.findByRole('button', { name: '詳細を展開' })
      );
    await open();
    await screen.findByRole('tab', { name: '概要' });
    expect(matchDetailCalls()).toBe(1);

    rerenderWith('b#JP1');
    await open();
    await screen.findByRole('tab', { name: '概要' });
    expect(matchDetailCalls()).toBe(2);
  });
});
