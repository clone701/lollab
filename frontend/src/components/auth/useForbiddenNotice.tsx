'use client';

import { useEffect, useState } from 'react';
import { subscribeForbidden } from '@/lib/api';

/**
 * API から 403 を受けたログイン中のユーザーか。
 * 403 を受けたユーザーの id を覚えるため、別のアカウントでログインし直せば解除される。
 */
export function useForbiddenNotice(userId: string | undefined): boolean {
  const [forbiddenUserId, setForbiddenUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    return subscribeForbidden(() => setForbiddenUserId(userId));
  }, [userId]);

  return userId !== undefined && forbiddenUserId === userId;
}
