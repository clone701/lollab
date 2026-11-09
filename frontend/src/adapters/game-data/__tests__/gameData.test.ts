import {
  fetchChampionData,
  fetchItemData,
  fetchRuneData,
  fetchSkillValues,
  fetchSummonerData,
  loadOnce,
} from '..';

const mockFetch = jest.fn();

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

// loadOnce は URL ごとの保持がモジュールに残るため、テストごとに別の URL を使う
describe('loadOnce', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  it('同じ URL を2回呼んでも fetch は1回', async () => {
    mockFetch.mockResolvedValue(jsonResponse(200, { a: 1 }));
    const first = loadOnce('/test/once.json');
    const second = loadOnce('/test/once.json');
    expect(second).toBe(first);
    expect(await first).toEqual({ a: 1 });
    await loadOnce('/test/once.json');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('URL が違えばそれぞれ fetch する', async () => {
    mockFetch.mockResolvedValue(jsonResponse(200, {}));
    await loadOnce('/test/other-a.json');
    await loadOnce('/test/other-b.json');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('HTTP エラーで失敗し、次の呼び出しで再び fetch する', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(404, null));
    await expect(loadOnce('/test/retry-http.json')).rejects.toThrow();
    mockFetch.mockResolvedValueOnce(jsonResponse(200, { ok: true }));
    await expect(loadOnce('/test/retry-http.json')).resolves.toEqual({
      ok: true,
    });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('通信エラーで失敗したら次の呼び出しで再び fetch する', async () => {
    mockFetch.mockRejectedValueOnce(new TypeError('network'));
    await expect(loadOnce('/test/retry-net.json')).rejects.toThrow('network');
    mockFetch.mockResolvedValueOnce(jsonResponse(200, { ok: true }));
    await expect(loadOnce('/test/retry-net.json')).resolves.toEqual({
      ok: true,
    });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});

describe('fetch 関数の URL', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockResolvedValue(jsonResponse(200, {}));
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  it('アイテム・ルーン・スペルは /images/data/ja_JP/ のファイルを取る', async () => {
    await fetchItemData();
    await fetchRuneData();
    await fetchSummonerData();
    expect(mockFetch.mock.calls.map(([url]) => url)).toEqual([
      '/images/data/ja_JP/item.json',
      '/images/data/ja_JP/runesReforged.json',
      '/images/data/ja_JP/summoner.json',
    ]);
  });

  it('fetchChampionData はウーコンなら MonkeyKing.json を取る', async () => {
    await fetchChampionData('Wukong');
    expect(mockFetch).toHaveBeenCalledWith(
      '/images/data/ja_JP/champion/MonkeyKing.json'
    );
  });

  it('fetchChampionData はそれ以外の ID をそのままファイル名にする', async () => {
    await fetchChampionData('Urgot');
    expect(mockFetch).toHaveBeenCalledWith(
      '/images/data/ja_JP/champion/Urgot.json'
    );
  });
});

describe('fetchSkillValues', () => {
  const values = { version: '16.21.1', passive: null, spells: [null] };

  beforeEach(() => {
    mockFetch.mockReset();
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  it('/data/skills/<Key>.json を取る（ウーコンは MonkeyKing）', async () => {
    mockFetch.mockResolvedValue(jsonResponse(200, values));
    await expect(fetchSkillValues('Wukong')).resolves.toEqual(values);
    expect(mockFetch).toHaveBeenCalledWith('/data/skills/MonkeyKing.json');
  });

  it('それ以外の ID はそのままファイル名にする', async () => {
    mockFetch.mockResolvedValue(jsonResponse(200, values));
    await fetchSkillValues('Ahri');
    expect(mockFetch).toHaveBeenCalledWith('/data/skills/Ahri.json');
  });

  it('404 は null', async () => {
    mockFetch.mockResolvedValue(jsonResponse(404, null));
    await expect(fetchSkillValues('NoFile404')).resolves.toBeNull();
  });

  it('404 以外のエラーは失敗のまま', async () => {
    mockFetch.mockResolvedValue(jsonResponse(500, null));
    await expect(fetchSkillValues('Error500')).rejects.toThrow();
    mockFetch.mockRejectedValue(new TypeError('network'));
    await expect(fetchSkillValues('ErrorNet')).rejects.toThrow('network');
  });
});
