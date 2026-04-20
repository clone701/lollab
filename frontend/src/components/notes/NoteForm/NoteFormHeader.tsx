'use client';

interface NoteFormHeaderProps {
  mode: 'create' | 'view' | 'edit';
  onEdit?: () => void;
  onDelete?: () => void;
}

export function NoteFormHeader({
  mode,
  onEdit,
  onDelete,
}: NoteFormHeaderProps) {
  const title =
    mode === 'create'
      ? '新規ノート作成'
      : mode === 'edit'
        ? 'ノート編集'
        : 'ノート詳細';
  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
      {mode === 'view' && (
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-black transition focus:outline-none focus:ring-2 focus:ring-gray-800"
            aria-label="ノートを編集"
          >
            編集
          </button>
          <button
            onClick={onDelete}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition focus:outline-none focus:ring-2 focus:ring-red-500"
            aria-label="ノートを削除"
          >
            削除
          </button>
        </div>
      )}
    </div>
  );
}
