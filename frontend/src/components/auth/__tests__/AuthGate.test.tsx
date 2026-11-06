import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { usePathname } from 'next/navigation';
import { AuthGate } from '@/components/auth';
import { useAuth } from '@/lib/contexts/AuthContext';
import { notifyForbidden } from '@/lib/api/notifyForbidden';

jest.mock('next/navigation', () => ({ usePathname: jest.fn() }));
jest.mock('@/lib/contexts/AuthContext', () => ({ useAuth: jest.fn() }));

const signInWithGoogle = jest.fn();
const signOut = jest.fn();

interface AuthState {
  loading: boolean;
  userId: string | null;
}

function mockAuth({ loading, userId }: AuthState): void {
  jest.mocked(useAuth).mockReturnValue({
    user: userId ? { id: userId } : null,
    session: userId ? { access_token: 't' } : null,
    loading,
    signInWithGoogle,
    signOut,
  } as unknown as ReturnType<typeof useAuth>);
}

function renderGate(): ReturnType<typeof render> {
  return render(
    <AuthGate>
      <p>アプリ本体</p>
    </AuthGate>
  );
}

describe('AuthGate', () => {
  beforeEach(() => {
    jest.mocked(usePathname).mockReturnValue('/');
    signInWithGoogle.mockReset();
    signOut.mockReset();
  });

  it('認証状態の取得中はローディングだけを表示する', () => {
    mockAuth({ loading: true, userId: null });
    renderGate();
    expect(screen.getByRole('status')).toHaveTextContent('読み込み中');
    expect(screen.queryByText('アプリ本体')).not.toBeInTheDocument();
  });

  it('未ログインならログイン画面だけを表示し、ボタンでログインを始める', async () => {
    mockAuth({ loading: false, userId: null });
    renderGate();
    expect(screen.queryByText('アプリ本体')).not.toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', { name: 'Google でログイン' })
    );
    expect(signInWithGoogle).toHaveBeenCalledTimes(1);
  });

  it('ログイン済みなら子要素を表示する', () => {
    mockAuth({ loading: false, userId: 'u1' });
    renderGate();
    expect(screen.getByText('アプリ本体')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Google でログイン' })
    ).not.toBeInTheDocument();
  });

  it('API から 403 を受けたら利用不可の表示とログアウトボタンにする', async () => {
    mockAuth({ loading: false, userId: 'u1' });
    renderGate();
    act(() => notifyForbidden());
    expect(
      screen.getByText('このアカウントでは利用できません')
    ).toBeInTheDocument();
    expect(screen.queryByText('アプリ本体')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'ログアウト' }));
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it('別のアカウントでログインし直したら利用不可の表示を解除する', () => {
    mockAuth({ loading: false, userId: 'u1' });
    const { rerender } = renderGate();
    act(() => notifyForbidden());
    mockAuth({ loading: false, userId: 'u2' });
    rerender(
      <AuthGate>
        <p>アプリ本体</p>
      </AuthGate>
    );
    expect(screen.getByText('アプリ本体')).toBeInTheDocument();
  });

  it('未ログイン中の 403 通知は無視する', () => {
    mockAuth({ loading: false, userId: null });
    renderGate();
    act(() => notifyForbidden());
    expect(
      screen.queryByText('このアカウントでは利用できません')
    ).not.toBeInTheDocument();
  });

  describe('NEXT_PUBLIC_AUTH_GATE_ENABLED=false', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_AUTH_GATE_ENABLED = 'false';
    });
    afterEach(() => {
      delete process.env.NEXT_PUBLIC_AUTH_GATE_ENABLED;
    });

    it('未ログイン・取得中でも子要素を表示する', () => {
      mockAuth({ loading: true, userId: null });
      renderGate();
      expect(screen.getByText('アプリ本体')).toBeInTheDocument();
    });

    it('403 を受けたら利用不可の表示にする', () => {
      mockAuth({ loading: false, userId: 'u1' });
      renderGate();
      act(() => notifyForbidden());
      expect(
        screen.getByText('このアカウントでは利用できません')
      ).toBeInTheDocument();
      expect(screen.queryByText('アプリ本体')).not.toBeInTheDocument();
    });
  });

  it.each(['/auth/callback', '/auth/callback/'])(
    '%s は未ログイン・取得中でも対象外にする',
    (pathname) => {
      jest.mocked(usePathname).mockReturnValue(pathname);
      mockAuth({ loading: true, userId: null });
      renderGate();
      expect(screen.getByText('アプリ本体')).toBeInTheDocument();
    }
  );
});
