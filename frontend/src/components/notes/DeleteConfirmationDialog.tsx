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
        className="absolute inset-0 bg-black/20"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* ダイアログボックス */}
      <div
        className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        {/* メッセージ */}
        <h2 id="dialog-title" className="text-xl font-bold text-gray-900 mb-2">
          このノートを削除しますか？
        </h2>

        {/* 警告 */}
        <p className="text-sm text-gray-600 mb-6">この操作は取り消せません</p>

        {/* ボタン */}
        <div className="flex gap-3 justify-end">
          {/* キャンセルボタン（グレー） */}
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors font-medium"
          >
            キャンセル
          </button>

          {/* 削除ボタン（赤色） */}
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium"
          >
            削除
          </button>
        </div>
      </div>
    </div>
  );
}
