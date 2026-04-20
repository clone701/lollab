'use client';

import { useState, useEffect } from 'react';
import { GeneralNote } from '@/types/generalNote';
import { getGeneralNotes } from '@/adapters/supabase';
import { GeneralNoteCard } from '../GeneralNoteCard';
import { NoteFilterBar } from './NoteFilterBar';
import { useNoteFilter } from './useNoteFilter';

interface GeneralNoteListProps {
  refreshKey: number;
  onCreateNew: () => void;
  onNoteClick: (noteId: number) => void;
}

export function GeneralNoteList({
  refreshKey,
  onCreateNew,
  onNoteClick,
}: GeneralNoteListProps) {
  const [notes, setNotes] = useState<GeneralNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  const {
    searchQuery,
    setSearchQuery,
    activeTag,
    toggleTag,
    allTags,
    filteredNotes,
  } = useNoteFilter(notes);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getGeneralNotes()
      .then(setNotes)
      .catch(() => setError('ノートの取得に失敗しました'))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const handleNoteClick = (noteId: number) => {
    setSelectedNoteId(noteId);
    onNoteClick(noteId);
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800" />
      </div>
    );

  if (error) return <p className="text-red-600 text-sm p-4">{error}</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-700">ノート一覧</span>
        <button
          type="button"
          onClick={onCreateNew}
          className="px-3 py-1.5 bg-gray-800 text-white text-sm rounded hover:bg-gray-700 transition-colors"
        >
          新規作成
        </button>
      </div>
      <NoteFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        allTags={allTags}
        activeTag={activeTag}
        onToggleTag={toggleTag}
      />
      {filteredNotes.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-8">
          {notes.length === 0
            ? 'ノートがありません'
            : '該当するノートがありません'}
        </p>
      ) : (
        <div className="space-y-2">
          {filteredNotes.map((note) => (
            <GeneralNoteCard
              key={note.id}
              note={note}
              isSelected={selectedNoteId === note.id}
              onClick={handleNoteClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}
