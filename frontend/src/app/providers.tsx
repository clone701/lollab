'use client';

import { useState } from 'react';
import { SessionProvider } from 'next-auth/react';
import { LoadingContext } from '@/lib/contexts/LoadingContext';
import GlobalLoading from '@/components/GlobalLoading';

export function Providers({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(false);

  return (
    <SessionProvider>
      <LoadingContext.Provider value={{ loading, setLoading }}>
        {children}
        <GlobalLoading loading={loading} />
      </LoadingContext.Provider>
    </SessionProvider>
  );
}