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
      <h2 className="text-2xl font-bold text-fg">{title}</h2>
      {mode === 'view' && (
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="px-4 py-2 bg-action text-white rounded-lg hover:bg-action-hover transition focus:outline-none focus:ring-2 focus:ring-accent"
            aria-label="ノートを編集"
          >
            編集
          </button>
          <button
            onClick={onDelete}
            className="px-4 py-2 bg-danger text-white rounded-lg hover:bg-danger-hover transition focus:outline-none focus:ring-2 focus:ring-danger"
            aria-label="ノートを削除"
          >
            削除
          </button>
        </div>
      )}
    </div>
  );
}
