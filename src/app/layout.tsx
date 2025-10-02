import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LoL Lab',
  description: '努力を勝率に変える — LoL Lab',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
