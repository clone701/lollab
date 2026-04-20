'use client';

interface NoteFormActionsProps {
  mode: 'create' | 'view' | 'edit';
  saving: boolean;
  onSave: () => void;
  onCancel?: () => void;
}

export function NoteFormActions({
  mode,
  saving,
  onSave,
  onCancel,
}: NoteFormActionsProps) {
  if (mode === 'view') return null;
  return (
    <div className="space-y-2">
      <button
        onClick={onSave}
        disabled={saving}
        className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-black transition disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-800"
        aria-label="ノートを保存"
      >
        {saving ? '保存中...' : '保存'}
      </button>
      <button
        onClick={onCancel}
        className="w-full px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition focus:outline-none focus:ring-2 focus:ring-gray-800"
        aria-label={
          mode === 'edit' ? '編集をキャンセル' : 'ノート作成をキャンセル'
        }
      >
        キャンセル
      </button>
    </div>
  );
}
