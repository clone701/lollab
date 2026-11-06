import { createClient } from '@/lib/supabase/client';
import { exchangeCodeForSession } from '../exchangeCodeForSession';

const mockExchange = jest.fn();
const mockGetSession = jest.fn();

describe('exchangeCodeForSession', () => {
  beforeEach(() => {
    mockExchange.mockReset();
    mockGetSession.mockReset();
    jest.mocked(createClient).mockReturnValue({
      auth: {
        exchangeCodeForSession: mockExchange,
        getSession: mockGetSession,
      },
    } as unknown as ReturnType<typeof createClient>);
  });

  it('code をクライアントの exchangeCodeForSession に渡す', async () => {
    mockExchange.mockResolvedValue({ error: null });
    await expect(exchangeCodeForSession('abc')).resolves.toBeUndefined();
    expect(mockExchange).toHaveBeenCalledWith('abc');
    expect(mockGetSession).not.toHaveBeenCalled();
  });

  it('交換に失敗し、セッションもなければ throw する', async () => {
    const error = new Error('invalid code');
    mockExchange.mockResolvedValue({ error });
    mockGetSession.mockResolvedValue({ data: { session: null } });
    await expect(exchangeCodeForSession('bad')).rejects.toBe(error);
  });

  it('交換に失敗しても、自動交換でセッションができていれば成功とする', async () => {
    mockExchange.mockResolvedValue({ error: new Error('verifier missing') });
    mockGetSession.mockResolvedValue({ data: { session: { user: {} } } });
    await expect(exchangeCodeForSession('abc')).resolves.toBeUndefined();
  });
});
