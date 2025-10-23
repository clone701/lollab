'use client';

import React, { createContext, useState } from 'react';
import { SessionProvider } from 'next-auth/react';
import GlobalLoading from '../components/GlobalLoading';

export const LoadingContext = createContext<{
  loading: boolean;
  setLoading: (v: boolean) => void;
}>({
  loading: false,
  setLoading: () => {},
});

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