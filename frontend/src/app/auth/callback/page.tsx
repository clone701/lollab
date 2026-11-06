import { Suspense } from 'react';
import { AuthCallback, AuthCallbackPending } from '@/components/auth';

// useSearchParams は静的書き出しのため Suspense で囲む
export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<AuthCallbackPending />}>
      <AuthCallback />
    </Suspense>
  );
}
