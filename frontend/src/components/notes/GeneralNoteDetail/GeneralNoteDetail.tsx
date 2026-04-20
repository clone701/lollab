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
      <div className="flex items-center justify-between mb-4 border-b border-gray-200 pb-3">
        <h2 className="text-xl font-bold text-gray-800 truncate mr-4">
          {note.title}
        </h2>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-gray-600">
            {formatDate(note.updated_at)}
          </span>
          <button
            onClick={onEdit}
            className="px-3 py-1.5 text-sm bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors duration-150"
          >
            編集
          </button>
          <button
            onClick={onDelete}
            className="px-3 py-1.5 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors duration-150"
          >
            削除
          </button>
        </div>
      </div>

      {/* 本文: MarkdownRenderer でレンダリング */}
      <div className="flex-1 overflow-y-auto mb-4 bg-gray-50 rounded-lg p-4 border border-gray-100">
        <MarkdownRenderer content={note.body ?? ''} />
      </div>

      {/* フッター: タグバッジ */}
      {note.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-200">
          {note.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full border border-gray-200"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
