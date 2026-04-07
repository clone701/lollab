import type { Metadata } from 'next';
import { Providers } from './providers';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import './globals.css';

export const metadata: Metadata = {
  title: 'LoL Lab',
  description: 'League of Legends戦略分析ツール',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <Providers>
          <Navbar />
          <main className="mx-auto max-w-6xl px-4">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
