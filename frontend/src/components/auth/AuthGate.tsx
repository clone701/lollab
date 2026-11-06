'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { ForbiddenScreen } from './ForbiddenScreen';
import { isAuthCallbackPath } from './isAuthCallbackPath';
import { isAuthGateEnabled } from './isAuthGateEnabled';
import { LoadingScreen } from './LoadingScreen';
import { LoginScreen } from './LoginScreen';
import { useForbiddenNotice } from './useForbiddenNotice';

// 未ログインならログイン画面、API が 403 を返したら利用不可の画面だけを表示する。
// ログイン後のコールバック画面（/auth/callback）は対象外。
// NEXT_PUBLIC_AUTH_GATE_ENABLED=false のときはログイン要求をやめ、403 の表示だけ残す
export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, session, loading, signInWithGoogle, signOut } = useAuth();
  const isForbidden = useForbiddenNotice(user?.id);
  const isEnabled = isAuthGateEnabled(
    process.env.NEXT_PUBLIC_AUTH_GATE_ENABLED
  );

  if (isAuthCallbackPath(pathname)) return <>{children}</>;
  if (!isEnabled) {
    return isForbidden ? (
      <ForbiddenScreen onSignOut={signOut} />
    ) : (
      <>{children}</>
    );
  }
  if (loading) return <LoadingScreen />;
  if (!session) return <LoginScreen onSignIn={signInWithGoogle} />;
  if (isForbidden) return <ForbiddenScreen onSignOut={signOut} />;
  return <>{children}</>;
}
