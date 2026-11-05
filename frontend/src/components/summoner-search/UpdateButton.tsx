import { formatTimeAgo, secondsSince } from '@/lib/summoner-search';

interface UpdateButtonProps {
  lastUpdatedAt: string;
  isUpdating: boolean;
  onUpdate: () => void;
}

// 更新ボタンと最終更新からの経過時間
export default function UpdateButton({
  lastUpdatedAt,
  isUpdating,
  onUpdate,
}: UpdateButtonProps) {
  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onUpdate}
        disabled={isUpdating}
        className="rounded bg-action px-4 py-2 text-sm font-medium text-white transition-colors duration-150 enabled:hover:bg-action-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isUpdating ? '更新中...' : '更新'}
      </button>
      <p className="text-xs text-fg-muted">
        最終更新: {formatTimeAgo(secondsSince(lastUpdatedAt))}
      </p>
    </div>
  );
}
