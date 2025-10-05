'use client';

import Link from 'next/link';
import Image from 'next/image';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useState, useRef, useEffect } from 'react';

export default function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // メニュー外クリックで閉じる
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

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
        <div className="flex items-center gap-2" ref={menuRef}>
          {session ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center focus:outline-none"
                aria-label="アカウントメニュー"
              >
                <Image
                  src={session.user?.image ?? ''}
                  alt="User"
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full border border-gray-300"
                  referrerPolicy="no-referrer"
                />
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow-lg z-50">
                  <div className="px-4 py-2 text-sm text-gray-700">{session.user?.name}</div>
                  <div className="px-4 py-2 text-xs text-gray-500 truncate">{session.user?.email}</div>
                  <button
                    onClick={() => { setMenuOpen(false); signOut(); }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    ログアウト
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => signIn('google')}
              className="bg-gray-700 text-white px-4 py-1.5 rounded font-medium text-sm hover:bg-gray-900 transition"
              aria-label="ログイン"
            >
              ログイン
            </button>
          )}
        </div>
      </div>
    </header>
  );
}