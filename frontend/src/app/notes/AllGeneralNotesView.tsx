'use client';

import { useState, useEffect } from 'react';
import { GeneralNote } from '@/types/generalNote';
import { getGeneralNotes } from '@/adapters/supabase';
import { formatDate } from '@/lib/utils/dateHelpers';

interface AllGeneralNotesViewProps {
  onNoteClick: (noteId: number) => void;
  refreshKey: number;
}

const PAGE_SIZE = 10;

export function AllGeneralNotesView({
  onNoteClick,
  refreshKey,
}: AllGeneralNotesViewProps) {
  const [notes, setNotes] = useState<GeneralNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  useEffect(() => {
    setLoading(true);
    getGeneralNotes()
      .then(setNotes)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [refreshKey]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-800" />
      </div>
    );

  if (notes.length === 0)
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        ノートがありません
      </div>
    );

  const totalPages = Math.ceil(notes.length / PAGE_SIZE);
  const paged = notes.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold text-gray-900 mb-3">汎用ノート一覧</h2>
      <div className="space-y-2">
        {paged.map((note) => (
          <button
            key={note.id}
            type="button"
            onClick={() => onNoteClick(note.id)}
            className="w-full text-left flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:ring-2 hover:ring-blue-400 transition-colors duration-150"
          >
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-gray-800 truncate">
                {note.title}
              </p>
              {note.body && (
                <p className="text-xs text-gray-500 truncate">
                  {note.body.slice(0, 60)}
                </p>
              )}
            </div>
            {note.tags.length > 0 && (
              <div className="flex gap-1 shrink-0">
                {note.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded border border-gray-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <span className="text-xs text-gray-400 shrink-0">
              {formatDate(note.updated_at)}
            </span>
          </button>
        ))}
      </div>
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 text-sm bg-gray-800 text-white rounded hover:bg-gray-700 disabled:opacity-40 transition-colors duration-150"
          >
            前へ
          </button>
          <span className="px-3 py-1 text-sm text-gray-600">
            {page + 1} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="px-3 py-1.5 text-sm bg-gray-800 text-white rounded hover:bg-gray-700 disabled:opacity-40 transition-colors duration-150"
          >
            次へ
          </button>
        </div>
      )}
    </div>
  );
}
