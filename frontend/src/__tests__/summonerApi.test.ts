import { fetchSummonerDetail, updateSummoner } from '@/lib/api/summoner';

const mockFetch = jest.fn();

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

describe('lib/api/summoner', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  it('fetchSummonerDetail は GET /api/summoner/{region}/{gameName}/{tagLine} を呼ぶ', async () => {
    mockFetch.mockResolvedValue(jsonResponse(200, { ok: true }));
    await fetchSummonerDetail('JP', 'あ b', 'JP1');
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toMatch(/\/api\/summoner\/JP\/%E3%81%82%20b\/JP1$/);
    expect(init.method).toBeUndefined();
    expect(new Headers(init.headers).has('x-amz-content-sha256')).toBe(false);
  });

  it('updateSummoner は POST .../update を呼ぶ', async () => {
    mockFetch.mockResolvedValue(jsonResponse(200, { ok: true }));
    await updateSummoner('KR', 'name', 'KR1');
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toMatch(/\/api\/summoner\/KR\/name\/KR1\/update$/);
    expect(init.method).toBe('POST');
    // 本文のない POST は空文字の SHA-256 を付ける
    expect(new Headers(init.headers).get('x-amz-content-sha256')).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    );
  });

  it('エラー時は detail をメッセージにする', async () => {
    mockFetch.mockResolvedValue(
      jsonResponse(404, { detail: 'サモナーが見つかりません' })
    );
    await expect(fetchSummonerDetail('JP', 'a', 'b')).rejects.toThrow(
      'サモナーが見つかりません'
    );
  });

  it('detail がなければ HTTP ステータスをメッセージにする', async () => {
    mockFetch.mockResolvedValue(jsonResponse(500, {}));
    await expect(updateSummoner('JP', 'a', 'b')).rejects.toThrow(
      'APIエラー: 500'
    );
  });
});
