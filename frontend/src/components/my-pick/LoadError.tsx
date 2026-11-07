'use client';

// 読み込みの失敗と再試行ボタン
export function LoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="py-8 text-center">
      <p className="mb-3 text-sm text-danger-fg">読み込みに失敗しました</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded bg-action px-4 py-2 text-sm text-white transition-colors duration-150 hover:bg-action-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        再試行
      </button>
    </div>
  );
}
