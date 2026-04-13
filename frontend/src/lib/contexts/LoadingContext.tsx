'use client';

import { createContext } from 'react';

/**
 * LoadingContext
 *
 * アプリケーション全体でローディング状態を管理するためのContext
 * 任意のコンポーネントからローディング表示を制御できる
 */
export const LoadingContext = createContext<{
  loading: boolean;
  setLoading: (v: boolean) => void;
}>({
  loading: false,
  setLoading: () => {},
});
