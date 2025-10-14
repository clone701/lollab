'use client';

import './globals.css';
import { Inter } from 'next/font/google';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Providers } from './providers';
import GlobalLoading from '../components/GlobalLoading';
import { useState } from 'react';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(false);

  // loading状態を子コンポーネントに渡すなど工夫が必要です
  return (
    <html lang="ja">
      <body className={inter.className}>
        <Providers>
          <Navbar />
          <main className="mx-auto max-w-6xl px-4">{children}</main>
          <Footer />
        </Providers>
        <GlobalLoading loading={loading} />
      </body>
    </html>
  );
}