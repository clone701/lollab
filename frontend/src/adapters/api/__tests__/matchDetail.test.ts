import { ApiAuthError } from '@/lib/api';
import {
  MATCH_DETAIL_FAILED_MESSAGE,
  MATCH_DETAIL_RATE_LIMIT_MESSAGE,
  fetchMatchDetail,
} from '..';

const mockFetch = jest.fn();

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

describe('fetchMatchDetail', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  it('GET /api/match/{matchId} を呼び、応答をそのまま返す', async () => {
    mockFetch.mockResolvedValue(jsonResponse(200, { match_id: 'JP1_123' }));
    const res = await fetchMatchDetail('JP1_123');
    expect(res).toEqual({ match_id: 'JP1_123' });
    const [url] = mockFetch.mock.calls[0];
    expect(url).toMatch(/\/api\/match\/JP1_123$/);
  });

  it('429 は「しばらくしてから再試行してください」にする', async () => {
    mockFetch.mockResolvedValue(jsonResponse(429, { detail: 'x' }));
    await expect(fetchMatchDetail('JP1_1')).rejects.toThrow(
      MATCH_DETAIL_RATE_LIMIT_MESSAGE
    );
  });

  it.each([404, 422, 502, 500])(
    '%i は「試合詳細を取得できませんでした」にする',
    async (status) => {
      mockFetch.mockResolvedValue(jsonResponse(status, { detail: 'x' }));
      await expect(fetchMatchDetail('JP1_1')).rejects.toThrow(
        MATCH_DETAIL_FAILED_MESSAGE
      );
    }
  );

  it('接続できない場合も「試合詳細を取得できませんでした」にする', async () => {
    mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(fetchMatchDetail('JP1_1')).rejects.toThrow(
      MATCH_DETAIL_FAILED_MESSAGE
    );
  });

  it('403 は ApiAuthError のまま投げる', async () => {
    mockFetch.mockResolvedValue(jsonResponse(403, { detail: '利用不可' }));
    await expect(fetchMatchDetail('JP1_1')).rejects.toBeInstanceOf(
      ApiAuthError
    );
  });
});
