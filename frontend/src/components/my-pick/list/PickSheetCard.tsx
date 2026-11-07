import type { PickSheet } from '@/types/myPick';
import { LANE_LABELS } from '@/lib/my-pick';
import { formatDate } from '@/lib/utils/dateHelpers';

interface PickSheetCardProps {
  sheet: PickSheet;
  onOpen: (sheetId: number) => void;
}

// 一覧の1行。表の名前・レーン・入力済みの相手の数・更新日時
export function PickSheetCard({ sheet, onOpen }: PickSheetCardProps) {
  return (
    <button
      type="button"
      onClick={() => onOpen(sheet.id)}
      className="flex w-full items-center gap-3 rounded-lg border border-line bg-surface p-3 text-left transition-colors duration-150 hover:ring-2 hover:ring-accent/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-fg">
        {sheet.name}
      </span>
      <span className="shrink-0 rounded bg-surface-2 px-2 py-1 text-xs font-medium text-fg-muted">
        {LANE_LABELS[sheet.lane]}
      </span>
      <span className="shrink-0 text-xs text-fg-muted">
        {sheet.entryCount}体入力済み
      </span>
      <span className="shrink-0 text-xs text-fg-subtle">
        {formatDate(sheet.updatedAt)}
      </span>
    </button>
  );
}
