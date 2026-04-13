'use client';

import { useState } from 'react';
import { LoadingContext } from '@/lib/contexts/LoadingContext';
import { AuthContextProvider } from '@/lib/contexts/AuthContext';
import GlobalLoading from '@/components/GlobalLoading';

export function Providers({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(false);

  return (
    <AuthContextProvider>
      <LoadingContext.Provider value={{ loading, setLoading }}>
        {children}
        <GlobalLoading loading={loading} />
      </LoadingContext.Provider>
    </AuthContextProvider>
  );
}