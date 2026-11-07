import type { Champion } from '@/types/champion';
import { PickViewRow } from './PickViewRow';

interface PickViewListProps {
  /** 表示する相手（絞り込み後） */
  enemies: Champion[];
  picks: Record<string, string[]>;
  /** 表にピックが1つもないか（空の表のメッセージを出し分ける） */
  isSheetEmpty: boolean;
}

// 閲覧画面の行の一覧
export function PickViewList({
  enemies,
  picks,
  isSheetEmpty,
}: PickViewListProps) {
  if (enemies.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-fg-muted">
        {isSheetEmpty
          ? 'ピックが入力されていません。「編集」から追加できます'
          : '該当する相手チャンピオンがありません'}
      </p>
    );
  }
  return (
    <ul>
      {enemies.map((enemy) => (
        <PickViewRow key={enemy.id} enemy={enemy} pickIds={picks[enemy.id]} />
      ))}
    </ul>
  );
}
