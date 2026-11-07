'use client';

import { useState } from 'react';
import type { ShowToast } from './types';

export type Screen =
  | { mode: 'list' }
  | { mode: 'view'; sheetId: number }
  | { mode: 'edit'; sheetId: number };

// マイピックタブの画面（一覧・閲覧・編集）の切り替え
export function useMyPickScreen(onToast: ShowToast) {
  const [screen, setScreen] = useState<Screen>({ mode: 'list' });

  return {
    screen,
    showList: () => setScreen({ mode: 'list' }),
    showView: (sheetId: number) => setScreen({ mode: 'view', sheetId }),
    showEdit: (sheetId: number) => setScreen({ mode: 'edit', sheetId }),
    // 表が見つからない（削除済みなど）ときは一覧に戻して知らせる
    handleNotFound: () => {
      setScreen({ mode: 'list' });
      onToast('マイピック表が見つかりませんでした', 'error');
    },
  };
}
