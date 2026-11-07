// 新規作成ボタン
export function NewSheetButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded bg-action px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-action-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      新規作成
    </button>
  );
}
