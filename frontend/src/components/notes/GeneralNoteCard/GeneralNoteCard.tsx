'use client';

import { GeneralNote } from '@/types/generalNote';
import { formatDate } from '@/lib/utils/dateHelpers';

interface GeneralNoteCardProps {
  note: GeneralNote;
  isSelected: boolean;
  onClick: (noteId: number) => void;
}

export function GeneralNoteCard({
  note,
  isSelected,
  onClick,
}: GeneralNoteCardProps) {
  const bodyPreview = note.body ? note.body.slice(0, 100) : '';

  return (
    <button
      type="button"
      onClick={() => onClick(note.id)}
      className={`w-full text-left p-3 rounded-lg border transition-colors duration-150 ${
        isSelected
          ? 'ring-2 ring-blue-500 shadow-md shadow-blue-500/20 bg-blue-50 border-blue-200'
          : 'hover:ring-2 hover:ring-blue-400 bg-white border-gray-200'
      }`}
    >
      <h3 className="font-semibold text-gray-800 text-sm mb-1 truncate">
        {note.title}
      </h3>

      {bodyPreview && (
        <p className="text-xs text-gray-500 mb-2 line-clamp-2">{bodyPreview}</p>
      )}

      {note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {note.tags.map((tag) => (
            <span
              key={tag}
              className="px-1.5 py-0.5 bg-white text-gray-600 text-xs rounded border border-gray-300"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="text-xs text-gray-400 space-y-0.5">
        <p>作成: {formatDate(note.created_at)}</p>
        <p>更新: {formatDate(note.updated_at)}</p>
      </div>
    </button>
  );
}
