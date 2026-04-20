'use client';

import Toast from '@/components/ui/Toast';
import { NoteFormHeader } from './NoteFormHeader';
import { NoteFormActions } from './NoteFormActions';
import { NoteFormFields } from './NoteFormFields';
import { UseNoteFormReturn } from './types';

interface NoteFormViewProps extends UseNoteFormReturn {
  mode: 'create' | 'view' | 'edit';
  onCancel?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function NoteFormView({
  mode,
  onCancel,
  onEdit,
  onDelete,
  presetName,
  runes,
  runeKey,
  spells,
  items,
  memo,
  errors,
  saving,
  toast,
  setPresetName,
  setRunes,
  setSpells,
  setItems,
  setMemo,
  handleSave,
  handleRuneReset,
  handleCancel,
  hideToast,
}: NoteFormViewProps) {
  // キャンセル時はフォームを初期値に戻してから親のonCancelを呼ぶ
  const handleCancelClick = () => {
    handleCancel();
    onCancel?.();
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
      <NoteFormHeader mode={mode} onEdit={onEdit} onDelete={onDelete} />
      <NoteFormFields
        mode={mode}
        presetName={presetName}
        runes={runes}
        runeKey={runeKey}
        spells={spells}
        items={items}
        memo={memo}
        errors={errors}
        setPresetName={setPresetName}
        setRunes={setRunes}
        setSpells={setSpells}
        setItems={setItems}
        setMemo={setMemo}
        handleRuneReset={handleRuneReset}
      />
      <NoteFormActions
        mode={mode}
        saving={saving}
        onSave={handleSave}
        onCancel={handleCancelClick}
      />
    </div>
  );
}
