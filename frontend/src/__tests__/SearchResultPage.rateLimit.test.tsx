import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchResultPage from '@/components/summoner-search/SearchResultPage';
import { MOCK_SUMMONER } from '@/lib/summoner-search';
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

const RATE_LIMIT_DETAIL =
  'レート制限に達しました。しばらく待ってから再試行してください';
const mockFetch = jest.fn();

const DETAIL: SummonerDetail = {
  summoner: MOCK_SUMMONER,
  rankPosition: null,
  matches: [],
  championStats: { all: [], solo: [], flex: [] },
  championStatsYear: 2026,
};

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

function renderPage(): void {
  render(<SearchResultPage query="a#JP1" region="JP" onSearch={() => {}} />);
}

// API の detail が、加工されずにそのまま画面に表示されること（要件8.5）
describe('SearchResultPage: レート制限エラーの表示', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  it('検索が 429 で失敗したとき、API の detail をそのまま表示する', async () => {
    mockFetch.mockResolvedValue(
      jsonResponse(429, { detail: RATE_LIMIT_DETAIL })
    );
    renderPage();
    expect(await screen.findByText(RATE_LIMIT_DETAIL)).toBeInTheDocument();
  });

  it('更新が 429 で失敗したとき、API の detail をそのまま表示し、結果は残す', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(200, DETAIL));
    renderPage();
    const button = await screen.findByRole('button', { name: '更新' });

    mockFetch.mockResolvedValueOnce(
      jsonResponse(429, { detail: RATE_LIMIT_DETAIL })
    );
    await userEvent.click(button);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      RATE_LIMIT_DETAIL
    );
    await waitFor(() =>
      expect(screen.getByRole('button', { name: '更新' })).toBeEnabled()
    );
    expect(screen.getByText(MOCK_SUMMONER.name)).toBeInTheDocument();
  });
});
