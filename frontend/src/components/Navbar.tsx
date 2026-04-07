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
import { useSession, signIn, signOut } from 'next-auth/react';
import { useContext, useState, useEffect, useRef } from 'react';
import { LoadingContext } from '@/lib/contexts/LoadingContext';

export default function Navbar() {
  const { data: session, status } = useSession();
  const { setLoading } = useContext(LoadingContext);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  /**
   * ログイン処理
   */
  const handleSignIn = () => {
    setLoading(true);
    signIn('google');
  };

  /**
   * ログアウト処理
   */
  const handleSignOut = () => {
    setLoading(true);
    setIsMenuOpen(false);
    signOut();
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
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        {/* Left: ロゴとベータバッジ */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-2xl font-bold text-gray-900 tracking-tight hover:text-gray-700 transition-all"
          >
            LoL Lab
          </Link>
          <span className="bg-gray-100 text-gray-600 text-xs font-semibold rounded-full px-2.5 py-1">
            ベータ
          </span>
        </div>

        {/* Center: ナビゲーションリンク（レスポンシブ対応） */}
        <nav className="hidden gap-8 md:flex">
          <Link
            href="/"
            className="text-sm text-gray-600 hover:text-gray-900 transition"
          >
            ホーム
          </Link>
          <Link
            href="/champion"
            className="text-sm text-gray-600 hover:text-gray-900 transition"
          >
            チャンピオン
          </Link>
          <Link
            href="/notes"
            className="text-sm text-gray-600 hover:text-gray-900 transition"
          >
            ノート
          </Link>
        </nav>

        {/* Right: 認証状態に応じたUI表示 */}
        <div className="flex items-center gap-2">
          {status === 'loading' ? (
            // ローディング時: アニメーションするプレースホルダー（円形、36px）
            <div className="h-9 w-9 animate-pulse rounded-full bg-gray-200" />
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
                  src={session.user?.image || '/images/default-avatar.png'}
                  alt={session.user?.name || 'User'}
                  className="h-9 w-9 rounded-full border-2 border-gray-200 hover:border-blue-400 transition cursor-pointer"
                />
              </button>

              {/* ドロップダウンメニュー: フェードイン/アウトアニメーション */}
              {isMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-60 bg-white rounded-lg shadow-lg border border-gray-200 py-2 animate-fadeIn"
                  style={{
                    animation: 'fadeIn 0.2s ease-in-out',
                  }}
                >
                  {/* メニュー内容: ユーザー名、メールアドレス */}
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-base font-semibold text-gray-900">
                      {session.user?.name || 'ユーザー'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {session.user?.email || ''}
                    </p>
                  </div>

                  {/* ログアウトボタン */}
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                  >
                    ログアウト
                  </button>
                </div>
              )}
            </div>
          ) : (
            // 未ログイン時: 濃いグレーボタン（bg-gray-800）、ホバー効果（hover:bg-gray-900）
            <button
              onClick={handleSignIn}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-gray-800 hover:bg-gray-900 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
            >
              ログイン
            </button>
          )}
        </div>
      </div>

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
