'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const router = useRouter();

  return (
    <header className="bg-white border-b border-[var(--border)] text-[var(--foreground)] sticky top-0 z-40">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        {/* Left: Logo */}
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="text-lg font-bold tracking-tight text-[var(--foreground)]"
          >
            LoL Lab
          </Link>
          <span className="ml-1 bg-gray-100 text-gray-500 text-xs rounded px-2 py-0.5 border border-gray-200">
            ベータ
          </span>
        </div>

        {/* Center: simple nav */}
        <nav className="hidden gap-8 md:flex">
          <Link href="/" className="text-sm text-gray-500 hover:text-[var(--foreground)] transition">ホーム</Link>
          <Link href="/champions" className="text-sm text-gray-500 hover:text-[var(--foreground)] transition">チャンピオン</Link>
          <Link href="/notes" className="text-sm text-gray-500 hover:text-[var(--foreground)] transition">メモ</Link>
        </nav>

        {/* Right */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/login')}
            className="bg-gray-700 text-white px-4 py-1.5 rounded font-medium text-sm hover:bg-gray-900 transition"
            aria-label="ログイン"
          >
            ログイン
          </button>
        </div>
      </div>
    </header>
  );
}
