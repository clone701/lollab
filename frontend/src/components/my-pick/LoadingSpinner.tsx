// 読み込み中の表示
export function LoadingSpinner() {
  return (
    <div
      role="status"
      aria-label="読み込み中"
      className="flex h-40 items-center justify-center"
    >
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-accent" />
    </div>
  );
}
