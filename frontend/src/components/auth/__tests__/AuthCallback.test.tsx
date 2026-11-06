import { render, screen, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthCallback } from '@/components/auth';
import { exchangeCodeForSession } from '@/adapters/supabase';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));
jest.mock('@/adapters/supabase', () => ({ exchangeCodeForSession: jest.fn() }));

const replace = jest.fn();
const mockExchange = jest.mocked(exchangeCodeForSession);

function setQuery(query: string): void {
  jest
    .mocked(useSearchParams)
    .mockReturnValue(
      new URLSearchParams(query) as unknown as ReturnType<
        typeof useSearchParams
      >
    );
}

describe('AuthCallback', () => {
  beforeEach(() => {
    replace.mockReset();
    mockExchange.mockReset();
    jest
      .mocked(useRouter)
      .mockReturnValue({ replace } as unknown as ReturnType<typeof useRouter>);
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => jest.restoreAllMocks());

  it('code を exchangeCodeForSession に渡し、成功したら / へ遷移する', async () => {
    setQuery('code=abc123');
    mockExchange.mockResolvedValue(undefined);
    render(<AuthCallback />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/'));
    expect(mockExchange).toHaveBeenCalledTimes(1);
    expect(mockExchange).toHaveBeenCalledWith('abc123');
  });

  it('code がなければ交換せず、メッセージとトップへのリンクを表示する', () => {
    setQuery('error=access_denied');
    render(<AuthCallback />);
    expect(screen.getByRole('alert')).toHaveTextContent('ログインに失敗');
    expect(screen.getByRole('link', { name: 'トップへ戻る' })).toHaveAttribute(
      'href',
      '/'
    );
    expect(mockExchange).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });

  it('交換に失敗したらメッセージとトップへのリンクを表示し、遷移しない', async () => {
    setQuery('code=bad');
    mockExchange.mockRejectedValue(new Error('invalid code'));
    render(<AuthCallback />);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'ログインに失敗'
    );
    expect(
      screen.getByRole('link', { name: 'トップへ戻る' })
    ).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
