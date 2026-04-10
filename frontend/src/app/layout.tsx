import type { Metadata } from 'next';
import { Noto_Sans_JP } from 'next/font/google';
import { Providers } from './providers';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import './globals.css';

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-sans-jp',
});

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
    <html lang="ja" className={notoSansJP.variable}>
      <body className={notoSansJP.className}>
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
