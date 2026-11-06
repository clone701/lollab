import { createHash } from 'crypto';
import { getAccessToken } from '@/lib/api/getAccessToken';
import { ApiAuthError, apiFetch, subscribeForbidden } from '@/lib/api';

const EMPTY_SHA256 =
  'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

const mockFetch = jest.fn();
const mockGetAccessToken = jest.mocked(getAccessToken);

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

function sentHeaders(): Headers {
  return new Headers(mockFetch.mock.calls[0][1].headers);
}

function sha256(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

describe('apiFetch', () => {
  const originalBackendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockResolvedValue(jsonResponse(200, {}));
    global.fetch = mockFetch as unknown as typeof fetch;
    mockGetAccessToken.mockResolvedValue('token-123');
    delete process.env.NEXT_PUBLIC_BACKEND_URL;
  });

  afterEach(() => {
    if (originalBackendUrl === undefined) {
      delete process.env.NEXT_PUBLIC_BACKEND_URL;
    } else {
      process.env.NEXT_PUBLIC_BACKEND_URL = originalBackendUrl;
    }
  });

  describe('URL', () => {
    it('NEXT_PUBLIC_BACKEND_URL が未設定なら同じオリジンのパスを呼ぶ', async () => {
      await apiFetch('/api/summoner/JP/a/b');
      expect(mockFetch.mock.calls[0][0]).toBe('/api/summoner/JP/a/b');
    });

    it('NEXT_PUBLIC_BACKEND_URL があれば先頭に付ける', async () => {
      process.env.NEXT_PUBLIC_BACKEND_URL = 'http://localhost:8000';
      await apiFetch('/api/x');
      expect(mockFetch.mock.calls[0][0]).toBe('http://localhost:8000/api/x');
    });
  });

  describe('X-Lollab-Auth', () => {
    it('ログイン中はアクセストークンを Bearer で付ける', async () => {
      await apiFetch('/api/x');
      expect(sentHeaders().get('X-Lollab-Auth')).toBe('Bearer token-123');
    });

    it('未ログインなら付けない', async () => {
      mockGetAccessToken.mockResolvedValue(null);
      await apiFetch('/api/x');
      expect(sentHeaders().has('X-Lollab-Auth')).toBe(false);
    });

    it('Authorization ヘッダーは付けない', async () => {
      await apiFetch('/api/x', { method: 'POST', body: '{}' });
      expect(sentHeaders().has('Authorization')).toBe(false);
    });

    it('呼び出し側のヘッダーと signal を残す', async () => {
      const signal = new AbortController().signal;
      await apiFetch('/api/x', {
        headers: { 'Content-Type': 'application/json' },
        signal,
      });
      expect(sentHeaders().get('Content-Type')).toBe('application/json');
      expect(mockFetch.mock.calls[0][1].signal).toBe(signal);
    });
  });

  describe('x-amz-content-sha256', () => {
    it.each(['GET', 'HEAD', 'get'])('%s では付けない', async (method) => {
      await apiFetch('/api/x', { method });
      expect(sentHeaders().has('x-amz-content-sha256')).toBe(false);
    });

    it('method を省略した場合（GET）も付けない', async () => {
      await apiFetch('/api/x');
      expect(sentHeaders().has('x-amz-content-sha256')).toBe(false);
    });

    it('本文のない POST は空文字の SHA-256 を付ける', async () => {
      await apiFetch('/api/x/update', { method: 'POST' });
      expect(sentHeaders().get('x-amz-content-sha256')).toBe(EMPTY_SHA256);
    });

    it('本文のない DELETE も空文字の SHA-256 を付ける', async () => {
      await apiFetch('/api/x', { method: 'DELETE' });
      expect(sentHeaders().get('x-amz-content-sha256')).toBe(EMPTY_SHA256);
    });

    it('本文があれば UTF-8 のバイト列の SHA-256（16進小文字）を付ける', async () => {
      const body = JSON.stringify({ name: 'あいう', n: 1 });
      await apiFetch('/api/x', { method: 'PUT', body });
      const hash = sentHeaders().get('x-amz-content-sha256');
      expect(hash).toBe(sha256(body));
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('URLSearchParams の本文はその文字列のハッシュを付ける', async () => {
      const body = new URLSearchParams({ a: '1', b: 'x y' });
      await apiFetch('/api/x', { method: 'POST', body });
      expect(sentHeaders().get('x-amz-content-sha256')).toBe(
        sha256('a=1&b=x+y')
      );
    });

    it('署名できない本文（FormData）は fetch せずに拒否する', async () => {
      await expect(
        apiFetch('/api/x', { method: 'POST', body: new FormData() })
      ).rejects.toThrow(TypeError);
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('401・403', () => {
    it('401 は status と detail を持つ ApiAuthError にする', async () => {
      mockFetch.mockResolvedValue(
        jsonResponse(401, { detail: '認証が必要です' })
      );
      const promise = apiFetch('/api/x');
      await expect(promise).rejects.toBeInstanceOf(ApiAuthError);
      await expect(promise).rejects.toMatchObject({
        status: 401,
        message: '認証が必要です',
      });
    });

    it('401 では 403 の通知をしない', async () => {
      const listener = jest.fn();
      const unsubscribe = subscribeForbidden(listener);
      mockFetch.mockResolvedValue(jsonResponse(401, {}));
      await expect(apiFetch('/api/x')).rejects.toBeInstanceOf(ApiAuthError);
      unsubscribe();
      expect(listener).not.toHaveBeenCalled();
    });

    it('403 は ApiAuthError にして、AuthGate 向けに通知する', async () => {
      const listener = jest.fn();
      const unsubscribe = subscribeForbidden(listener);
      mockFetch.mockResolvedValue(
        jsonResponse(403, { detail: 'このアカウントでは利用できません' })
      );
      const promise = apiFetch('/api/x');
      await expect(promise).rejects.toMatchObject({
        name: 'ApiAuthError',
        status: 403,
        message: 'このアカウントでは利用できません',
      });
      unsubscribe();
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('detail がなければ HTTP ステータスをメッセージにする', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => {
          throw new Error('not json');
        },
      } as unknown as Response);
      await expect(apiFetch('/api/x')).rejects.toThrow('APIエラー: 403');
    });

    it('その他のエラー応答は投げずにそのまま返す', async () => {
      const res = jsonResponse(500, { detail: 'x' });
      mockFetch.mockResolvedValue(res);
      await expect(apiFetch('/api/x')).resolves.toBe(res);
    });
  });
});
