'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { exchangeCodeForSession } from '@/adapters/supabase';

export type AuthCallbackStatus = 'pending' | 'error';

/** code をセッションに交換し、成功したらトップへ遷移する */
export function useAuthCallback(code: string | null): AuthCallbackStatus {
  const router = useRouter();
  const [hasFailed, setHasFailed] = useState(false);
  // code は1回しか使えないため、開発時の Effect の二重実行でも交換は1回にする
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (code === null || hasStartedRef.current) return;
    hasStartedRef.current = true;
    exchangeCodeForSession(code)
      .then(() => router.replace('/'))
      .catch((error: unknown) => {
        console.error('Code exchange error:', error);
        setHasFailed(true);
      });
  }, [code, router]);

  return code === null || hasFailed ? 'error' : 'pending';
}
