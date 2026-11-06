'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AuthCallbackPending } from './AuthCallbackPending';
import { useAuthCallback } from './useAuthCallback';

// Google ログイン後の戻り先。クエリの code をセッションに交換してトップへ遷移する
export function AuthCallback() {
  const code = useSearchParams().get('code');
  const status = useAuthCallback(code);

  if (status === 'pending') return <AuthCallbackPending />;
  return (
    <div className="flex flex-col items-center gap-4 py-16">
      <p role="alert" className="text-danger-fg">
        ログインに失敗しました。もう一度お試しください。
      </p>
      <Link
        href="/"
        className="rounded-lg bg-action px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-action-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        トップへ戻る
      </Link>
    </div>
  );
}
