'use client';

import { useState } from 'react';

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info';
}

/**
 * トースト通知を管理するカスタムフック
 *
 * @returns toast - 現在のトースト状態
 * @returns showToast - トーストを表示する関数
 * @returns hideToast - トーストを非表示にする関数
 */
const useToast = () => {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
  };

  const hideToast = () => {
    setToast(null);
  };

  return { toast, showToast, hideToast };
};

export default useToast;
