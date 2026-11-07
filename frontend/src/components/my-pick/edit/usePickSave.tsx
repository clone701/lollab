'use client';

import { useState } from 'react';
import { savePickSheet } from '@/adapters/supabase';
import type { PickLane, PickRow } from '@/types/myPick';
import type { ShowToast } from '../types';

interface Draft {
  name: string;
  lane: PickLane;
  rows: PickRow[];
}

// 保存の実行。失敗しても編集内容は残るので、そのまま再保存できる
export function usePickSave(
  sheetId: number,
  draft: Draft,
  onSaved: () => void,
  onToast: ShowToast
) {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await savePickSheet(sheetId, draft.name, draft.lane, draft.rows);
      onSaved();
    } catch {
      onToast('保存に失敗しました。もう一度お試しください', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return { isSaving, handleSave };
}
