import { createClient } from '@/lib/supabase/client';

// jest.setup.js でモックされているため、実体を読み込む
const { getAccessToken } = jest.requireActual<
  typeof import('@/lib/api/getAccessToken')
>('@/lib/api/getAccessToken');

function mockSession(session: { access_token: string } | null): void {
  jest.mocked(createClient).mockReturnValueOnce({
    auth: { getSession: jest.fn().mockResolvedValue({ data: { session } }) },
  } as unknown as ReturnType<typeof createClient>);
}

describe('getAccessToken', () => {
  it('セッションのアクセストークンを返す', async () => {
    mockSession({ access_token: 'abc' });
    await expect(getAccessToken()).resolves.toBe('abc');
  });

  it('未ログインなら null を返す', async () => {
    mockSession(null);
    await expect(getAccessToken()).resolves.toBeNull();
  });
});
