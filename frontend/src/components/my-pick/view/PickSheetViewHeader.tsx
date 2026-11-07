import type { PickSheet } from '@/types/myPick';
import { LANE_LABELS } from '@/lib/my-pick';

interface PickSheetViewHeaderProps {
  sheet: PickSheet;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const BUTTON =
  'rounded px-3 py-2 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-accent';

// 閲覧画面の見出しと操作（一覧に戻る・編集・削除）
export function PickSheetViewHeader(p: PickSheetViewHeaderProps) {
  return (
    <header className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={p.onBack}
        className={`${BUTTON} bg-surface-2 text-fg-muted hover:bg-line`}
      >
        一覧に戻る
      </button>
      <h2 className="min-w-0 flex-1 truncate text-xl font-bold text-fg">
        {p.sheet.name}
      </h2>
      <span className="rounded bg-surface-2 px-2 py-1 text-xs font-medium text-fg-muted">
        {LANE_LABELS[p.sheet.lane]}
      </span>
      <button
        type="button"
        onClick={p.onEdit}
        className={`${BUTTON} bg-action text-white hover:bg-action-hover`}
      >
        編集
      </button>
      <button
        type="button"
        onClick={p.onDelete}
        className={`${BUTTON} bg-danger text-white hover:bg-danger-hover`}
      >
        削除
      </button>
    </header>
  );
}
