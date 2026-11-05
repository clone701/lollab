'use client';

import { useState } from 'react';
import { GeneralNoteCard } from '../GeneralNoteCard';
import { NoteFilterBar } from './NoteFilterBar';
import { useGeneralNotes } from './useGeneralNotes';
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
  const { notes, isLoading, hasError } = useGeneralNotes(refreshKey);
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  const {
    searchQuery,
    setSearchQuery,
    activeTag,
    toggleTag,
    allTags,
    filteredNotes,
  } = useNoteFilter(notes);

  const handleNoteClick = (noteId: number) => {
    setSelectedNoteId(noteId);
    onNoteClick(noteId);
  };

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
      </div>
    );

  if (hasError)
    return (
      <p className="text-danger-fg text-sm p-4">ノートの取得に失敗しました</p>
    );

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-fg-muted">ノート一覧</span>
        <button
          type="button"
          onClick={onCreateNew}
          className="px-3 py-1.5 bg-action text-white text-sm rounded hover:bg-action-hover transition-colors"
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
        <p className="text-fg-muted text-sm text-center py-8">
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
