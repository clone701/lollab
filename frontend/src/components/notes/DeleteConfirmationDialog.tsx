interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirmationDialog({
  isOpen,
  onConfirm,
  onCancel,
}: DeleteConfirmationDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* オーバーレイ（黒20%透明） */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* ダイアログボックス */}
      <div
        className="relative bg-surface rounded-lg shadow-xl max-w-md w-full p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        {/* メッセージ */}
        <h2 id="dialog-title" className="text-xl font-bold text-fg mb-2">
          このノートを削除しますか？
        </h2>

        {/* 警告 */}
        <p className="text-sm text-fg-muted mb-6">この操作は取り消せません</p>

        {/* ボタン */}
        <div className="flex gap-3 justify-end">
          {/* キャンセルボタン（グレー） */}
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-surface-2 text-fg-muted rounded-md hover:bg-line transition-colors font-medium"
          >
            キャンセル
          </button>

          {/* 削除ボタン（赤色） */}
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-danger text-white rounded-md hover:bg-danger-hover transition-colors font-medium"
          >
            削除
          </button>
        </div>
      </div>
    </div>
  );
}
