'use client';

import { confirmDiscard, validateSheetName } from '@/lib/my-pick';
import type { PickSheetDetail } from '@/types/myPick';
import { SheetMetaForm } from '../SheetMetaForm';
import type { ShowToast } from '../types';
import { EditorToolbar } from './EditorToolbar';
import { PickEditList } from './PickEditList';
import { useEnemyFilter } from './useEnemyFilter';
import { usePickEditor } from './usePickEditor';
import { usePickSave } from './usePickSave';
import { useUnsavedGuard } from './useUnsavedGuard';

interface PickSheetEditorBodyProps {
  sheet: PickSheetDetail;
  onSaved: () => void;
  onCancel: () => void;
  onDirtyChange: (isDirty: boolean) => void;
  onToast: ShowToast;
}

// 編集画面。全チャンピオンを相手の行として並べ、名前・レーン・ピックを編集する
export function PickSheetEditorBody(p: PickSheetEditorBodyProps) {
  const editor = usePickEditor(p.sheet);
  const filter = useEnemyFilter(editor.picks);
  useUnsavedGuard(editor.isDirty, p.onDirtyChange);
  const { isSaving, handleSave } = usePickSave(
    p.sheet.id,
    { name: editor.name, lane: editor.lane, rows: editor.rows },
    p.onSaved,
    p.onToast
  );
  const hasNameError = validateSheetName(editor.name).error !== null;

  const handleCancel = () => {
    if (!editor.isDirty || confirmDiscard()) p.onCancel();
  };

  return (
    <div className="flex flex-col gap-4">
      <SheetMetaForm
        idPrefix="edit"
        name={editor.name}
        lane={editor.lane}
        shouldShowError
        onNameChange={editor.setName}
        onLaneChange={editor.setLane}
      />
      <EditorToolbar
        query={filter.query}
        onQueryChange={filter.setQuery}
        isFilledOnly={filter.isFilledOnly}
        onFilledOnlyChange={filter.setIsFilledOnly}
        canSave={!hasNameError && !isSaving}
        onSave={handleSave}
        onCancel={handleCancel}
      />
      <PickEditList
        enemies={filter.enemies}
        picks={editor.picks}
        expanded={editor.expanded}
        onSetPick={editor.handleSetPick}
        onRemovePick={editor.handleRemovePick}
        onAddSlot={editor.handleAddSlot}
      />
    </div>
  );
}
