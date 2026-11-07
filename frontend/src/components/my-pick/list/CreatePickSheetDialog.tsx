'use client';

import type { PickLane } from '@/types/myPick';
import { ModalFrame } from '../ModalFrame';
import { SheetMetaForm } from '../SheetMetaForm';
import type { ShowToast } from '../types';
import { useCreatePickSheet } from './useCreatePickSheet';

interface CreatePickSheetDialogProps {
  /** レーンの初期値（一覧で絞り込み中のレーン） */
  initialLane: PickLane;
  onClose: () => void;
  onCreated: (sheetId: number) => void;
  onToast: ShowToast;
}

// 表の名前とレーンを入力して、表を作る
export function CreatePickSheetDialog(p: CreatePickSheetDialogProps) {
  const form = useCreatePickSheet(p.initialLane, p.onCreated, p.onToast);

  return (
    <ModalFrame titleId="create-pick-sheet-title" onClose={p.onClose}>
      <h2
        id="create-pick-sheet-title"
        className="mb-3 text-xl font-bold text-fg"
      >
        マイピック表を作る
      </h2>
      <form onSubmit={form.handleSubmit} className="flex flex-col gap-4">
        <SheetMetaForm
          idPrefix="create"
          name={form.name}
          lane={form.lane}
          shouldShowError={form.isTouched}
          onNameChange={form.handleNameChange}
          onLaneChange={form.setLane}
        />
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={p.onClose}
            className="rounded bg-surface-2 px-4 py-2 text-sm font-medium text-fg-muted hover:bg-line"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={form.isInvalid || form.isSubmitting}
            className="rounded bg-action px-4 py-2 text-sm font-medium text-white hover:bg-action-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            作成
          </button>
        </div>
      </form>
    </ModalFrame>
  );
}
