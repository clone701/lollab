'use client';

import { useState } from 'react';
import { filterSheetsByLane } from '@/lib/my-pick';
import type { PickLane } from '@/types/myPick';
import { LoadError } from '../LoadError';
import { LoadingSpinner } from '../LoadingSpinner';
import type { ShowToast } from '../types';
import { usePickSheets } from '../usePickSheets';
import { CreatePickSheetDialog } from './CreatePickSheetDialog';
import { LaneFilter } from './LaneFilter';
import { NewSheetButton } from './NewSheetButton';
import { PickSheetCards } from './PickSheetCards';

interface PickSheetListProps {
  onOpen: (sheetId: number) => void;
  onCreated: (sheetId: number) => void;
  onToast: ShowToast;
}

// マイピック表の一覧。レーンでの絞り込みと新規作成
export function PickSheetList(p: PickSheetListProps) {
  const { sheets, isLoading, hasError, reload } = usePickSheets();
  const [lane, setLane] = useState<PickLane | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  if (isLoading) return <LoadingSpinner />;
  if (hasError) return <LoadError onRetry={reload} />;

  const startCreating = () => setIsCreating(true);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-fg">マイピック表</h2>
        {sheets.length > 0 && <NewSheetButton onClick={startCreating} />}
      </div>
      {sheets.length === 0 ? (
        <div className="py-12 text-center">
          <p className="mb-4 text-sm text-fg-muted">マイピック表がありません</p>
          <NewSheetButton onClick={startCreating} />
        </div>
      ) : (
        <>
          <LaneFilter lane={lane} onChange={setLane} />
          <PickSheetCards
            sheets={filterSheetsByLane(sheets, lane)}
            onOpen={p.onOpen}
          />
        </>
      )}
      {isCreating && (
        <CreatePickSheetDialog
          initialLane={lane ?? 'TOP'}
          onClose={() => setIsCreating(false)}
          onCreated={p.onCreated}
          onToast={p.onToast}
        />
      )}
    </div>
  );
}
