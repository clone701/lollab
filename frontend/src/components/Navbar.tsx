/**
 * Navbar コンポーネント
 *
 * アプリケーション全体で使用するナビゲーションバー
 * - ロゴとベータバッジを表示
 * - ナビゲーションリンク（レスポンシブ対応）
 * - 認証状態に応じたUI表示（ユーザーアイコン）
 * - ドロップダウンメニュー（ユーザー名、メールアドレス、ログアウトボタン）
 * - ログイン・ログアウト時のローディング制御
 */

'use client';

import Link from 'next/link';
import { useContext, useState, useEffect, useRef } from 'react';
import { LoadingContext } from '@/lib/contexts/LoadingContext';
import { useAuth } from '@/lib/contexts/AuthContext';

export default function Navbar() {
  const { user, session, loading, signInWithGoogle, signOut } = useAuth();
  const { setLoading } = useContext(LoadingContext);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  /**
   * ログイン処理
   */
  const handleSignIn = async () => {
    setLoading(true);
    await signInWithGoogle();
    setLoading(false);
  };

  /**
   * ログアウト処理
   */
  const handleSignOut = async () => {
    setLoading(true);
    setIsMenuOpen(false);
    await signOut();
    setLoading(false);
  };

  /**
   * メニュー外側クリックで閉じる
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  /**
   * Escキーで閉じる
   */
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isMenuOpen]);

  return (
    <header className="bg-surface border-b border-line sticky top-0 z-40">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        {/* Left: ロゴとベータバッジ */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-2xl font-bold text-fg tracking-tight hover:text-fg-muted transition-all"
          >
            LoL Lab
          </Link>
          <span className="bg-surface-2 text-fg-muted text-xs font-semibold rounded-full px-2.5 py-1">
            ベータ
          </span>
        </div>

        {/* Center: ナビゲーションリンク（レスポンシブ対応） */}
        <nav className="hidden gap-8 md:flex">
          <Link
            href="/"
            className="text-sm text-fg-muted hover:text-fg transition"
          >
            ホーム
          </Link>
          <Link
            href="/champion"
            className="text-sm text-fg-muted hover:text-fg transition"
          >
            チャンピオン
          </Link>
          <Link
            href="/notes"
            className="text-sm text-fg-muted hover:text-fg transition"
          >
            ノート
          </Link>
        </nav>

        {/* Right: 認証状態 + モバイルハンバーガー */}
        <div className="flex items-center gap-2">
          {loading ? (
            // ローディング時: アニメーションするプレースホルダー（円形、36px）
            <div className="h-9 w-9 animate-pulse rounded-full bg-surface-2" />
          ) : session ? (
            // ログイン時: Googleアカウントのアバター画像（円形、36px）
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="relative group"
                aria-label="ユーザーメニュー"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    user?.user_metadata?.avatar_url ||
                    '/images/default-avatar.png'
                  }
                  alt={user?.user_metadata?.name || 'User'}
                  className="h-9 w-9 rounded-full border-2 border-line-strong hover:border-accent/60 transition cursor-pointer"
                />
              </button>

              {/* ドロップダウンメニュー: フェードイン/アウトアニメーション */}
              {isMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-60 bg-surface rounded-lg shadow-lg border border-line py-2 animate-fadeIn"
                  style={{
                    animation: 'fadeIn 0.2s ease-in-out',
                  }}
                >
                  {/* メニュー内容: ユーザー名、メールアドレス */}
                  <div className="px-4 py-3 border-b border-line">
                    <p className="text-base font-semibold text-fg">
                      {user?.user_metadata?.name || 'ユーザー'}
                    </p>
                    <p className="text-xs text-fg-muted mt-1">
                      {user?.email || ''}
                    </p>
                  </div>

                  {/* ログアウトボタン */}
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2 text-sm text-danger-fg hover:bg-danger/15 transition"
                  >
                    ログアウト
                  </button>
                </div>
              )}
            </div>
          ) : (
            // 未ログイン時: アクションボタン（bg-action）、ホバー効果（hover:bg-action-hover）
            <button
              onClick={handleSignIn}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-action hover:bg-action-hover rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
            >
              ログイン
            </button>
          )}
          {/* モバイルハンバーガーボタン */}
          <button
            onClick={() => setIsMobileMenuOpen((p) => !p)}
            className="md:hidden p-2 rounded-lg text-fg-muted hover:bg-surface-2 transition"
            aria-label="メニューを開く"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={
                  isMobileMenuOpen
                    ? 'M6 18L18 6M6 6l12 12'
                    : 'M4 6h16M4 12h16M4 18h16'
                }
              />
            </svg>
          </button>
        </div>
      </div>

      {/* モバイルメニュー */}
      {isMobileMenuOpen && (
        <nav className="md:hidden border-t border-line bg-surface px-4 py-2 flex flex-col gap-1">
          <Link
            href="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className="py-2 text-sm text-fg-muted hover:text-fg border-b border-line"
          >
            ホーム
          </Link>
          <Link
            href="/champion"
            onClick={() => setIsMobileMenuOpen(false)}
            className="py-2 text-sm text-fg-muted hover:text-fg border-b border-line"
          >
            チャンピオン
          </Link>
          <Link
            href="/notes"
            onClick={() => setIsMobileMenuOpen(false)}
            className="py-2 text-sm text-fg-muted hover:text-fg"
          >
            ノート
          </Link>
        </nav>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </header>
  );
}
