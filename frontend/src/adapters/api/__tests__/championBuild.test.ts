import { ApiAuthError } from '@/lib/api';
import { fetchChampionBuild } from '..';

const mockFetch = jest.fn();

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

describe('fetchChampionBuild', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  it('GET /api/champion/{name}/build に period・queue を付けて呼ぶ', async () => {
    mockFetch.mockResolvedValue(jsonResponse(200, { champion_name: 'Ahri' }));
    const res = await fetchChampionBuild('Ahri', {
      period: 'latest_patch',
      queue: 'all',
    });
    expect(res).toEqual({ champion_name: 'Ahri' });
    const [url] = mockFetch.mock.calls[0];
    expect(url).toMatch(
      /\/api\/champion\/Ahri\/build\?period=latest_patch&queue=all$/
    );
  });

  it('role を指定したときだけクエリに含める', async () => {
    mockFetch.mockResolvedValue(jsonResponse(200, {}));
    await fetchChampionBuild('LeeSin', {
      role: 'JUNGLE',
      period: 'all',
      queue: 'solo',
    });
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('/api/champion/LeeSin/build?');
    expect(url).toContain('role=JUNGLE');
    expect(url).toContain('period=all');
    expect(url).toContain('queue=solo');
  });

  it('422 は「チャンピオンが見つかりません」にする', async () => {
    mockFetch.mockResolvedValue(
      jsonResponse(422, { detail: [{ msg: 'string does not match pattern' }] })
    );
    await expect(
      fetchChampionBuild('Bad!', { period: 'all', queue: 'all' })
    ).rejects.toThrow('チャンピオンが見つかりません');
  });

  it('エラー時は detail をメッセージにする', async () => {
    mockFetch.mockResolvedValue(
      jsonResponse(500, { detail: 'サーバーエラーが発生しました' })
    );
    await expect(
      fetchChampionBuild('Ahri', { period: 'all', queue: 'all' })
    ).rejects.toThrow('サーバーエラーが発生しました');
  });

  it('detail がなければ HTTP ステータスをメッセージにする', async () => {
    mockFetch.mockResolvedValue(jsonResponse(502, {}));
    await expect(
      fetchChampionBuild('Ahri', { period: 'all', queue: 'all' })
    ).rejects.toThrow('APIエラー: 502');
  });

  it('403 は ApiAuthError のまま detail をメッセージにする', async () => {
    mockFetch.mockResolvedValue(
      jsonResponse(403, { detail: 'このアカウントでは利用できません' })
    );
    const promise = fetchChampionBuild('Ahri', { period: 'all', queue: 'all' });
    await expect(promise).rejects.toBeInstanceOf(ApiAuthError);
    await expect(promise).rejects.toMatchObject({
      status: 403,
      message: 'このアカウントでは利用できません',
    });
  });

  it('接続できない場合は接続エラーのメッセージにする', async () => {
    mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(
      fetchChampionBuild('Ahri', { period: 'all', queue: 'all' })
    ).rejects.toThrow('サーバーに接続できませんでした');
  });
});
