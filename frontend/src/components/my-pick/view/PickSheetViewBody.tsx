'use client';

import { useMemo, useState } from 'react';
import { deletePickSheet } from '@/adapters/supabase';
import DeleteConfirmationDialog from '@/components/notes/DeleteConfirmationDialog';
import { CHAMPIONS_BY_READING, filterEnemies, toPickMap } from '@/lib/my-pick';
import type { PickSheetDetail } from '@/types/myPick';
import { ChampionSearchInput } from '../ChampionSearchInput';
import type { ShowToast } from '../types';
import { PickSheetViewHeader } from './PickSheetViewHeader';
import { PickViewList } from './PickViewList';

interface PickSheetViewBodyProps {
  sheet: PickSheetDetail;
  onBack: () => void;
  onEdit: () => void;
  onDeleted: () => void;
  onToast: ShowToast;
}

// 閲覧画面。入力済みの行だけを、相手の名前で検索しながら見る
export function PickSheetViewBody(p: PickSheetViewBodyProps) {
  const [query, setQuery] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const picks = useMemo(() => toPickMap(p.sheet.rows), [p.sheet.rows]);
  const enemies = useMemo(
    () => filterEnemies(CHAMPIONS_BY_READING, picks, query, true),
    [picks, query]
  );

  const handleDeleteConfirm = async () => {
    try {
      await deletePickSheet(p.sheet.id);
      p.onDeleted();
    } catch {
      p.onToast('マイピック表の削除に失敗しました', 'error');
      setIsConfirming(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PickSheetViewHeader
        sheet={p.sheet}
        onBack={p.onBack}
        onEdit={p.onEdit}
        onDelete={() => setIsConfirming(true)}
      />
      <ChampionSearchInput
        value={query}
        onChange={setQuery}
        label="相手チャンピオンを検索"
      />
      <PickViewList
        enemies={enemies}
        picks={picks}
        isSheetEmpty={Object.keys(picks).length === 0}
      />
      <DeleteConfirmationDialog
        isOpen={isConfirming}
        title="このマイピック表を削除しますか？"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setIsConfirming(false)}
      />
    </div>
  );
}
