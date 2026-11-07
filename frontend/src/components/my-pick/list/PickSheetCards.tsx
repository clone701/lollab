import type { PickSheet } from '@/types/myPick';
import { PickSheetCard } from './PickSheetCard';

interface PickSheetCardsProps {
  /** 絞り込み後の表 */
  sheets: PickSheet[];
  onOpen: (sheetId: number) => void;
}

// 表のカード一覧。絞り込みで0件になったときは該当なしを出す
export function PickSheetCards({ sheets, onOpen }: PickSheetCardsProps) {
  if (sheets.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-fg-muted">
        該当するマイピック表がありません
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-2">
      {sheets.map((sheet) => (
        <li key={sheet.id}>
          <PickSheetCard sheet={sheet} onOpen={onOpen} />
        </li>
      ))}
    </ul>
  );
}
