'use client';

/**
 * GeneralNoteDetail コンポーネント
 *
 * 汎用ノートの詳細表示（タイトル・本文・タグ・更新日時・編集・削除ボタン）
 * Requirements: 2.1〜2.8
 */

import { GeneralNote } from '@/types/generalNote';
import { formatDate } from '@/lib/utils/dateHelpers';
import { MarkdownRenderer } from './MarkdownRenderer';

interface GeneralNoteDetailProps {
  note: GeneralNote;
  onEdit: () => void;
  onDelete: () => void;
}

export function GeneralNoteDetail({
  note,
  onEdit,
  onDelete,
}: GeneralNoteDetailProps) {
  return (
    <div className="flex flex-col h-full p-4">
      {/* ヘッダー行: タイトル（左）、更新日時・編集・削除ボタン（右） */}
      <div className="flex items-center justify-between mb-4 border-b border-line pb-3">
        <h2 className="text-xl font-bold text-fg truncate mr-4">
          {note.title}
        </h2>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-fg-muted">
            {formatDate(note.updated_at)}
          </span>
          <button
            onClick={onEdit}
            className="px-3 py-1.5 text-sm bg-action text-white rounded hover:bg-action-hover transition-colors duration-150"
          >
            編集
          </button>
          <button
            onClick={onDelete}
            className="px-3 py-1.5 text-sm bg-danger text-white rounded hover:bg-danger-hover transition-colors duration-150"
          >
            削除
          </button>
        </div>
      </div>

      {/* 本文: MarkdownRenderer でレンダリング */}
      <div className="flex-1 overflow-y-auto mb-4 bg-surface-2 rounded-lg p-4 border border-line">
        <MarkdownRenderer content={note.body ?? ''} />
      </div>

      {/* フッター: タグバッジ */}
      {note.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-3 border-t border-line">
          {note.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 text-xs bg-surface-2 text-fg-muted rounded-full border border-line"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
