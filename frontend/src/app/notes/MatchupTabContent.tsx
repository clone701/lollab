'use client';

import NoteList from '@/components/notes/NoteList';
import NoteForm from '@/components/notes/NoteForm';
import { NoteDetailView } from './NoteDetailView';
import { AllNotesView } from './AllNotesView';
import { MatchupTabContentProps } from './types';

export function MatchupTabContent({
  myChampionId,
  enemyChampionId,
  showForm,
  refreshKey,
  viewMode,
  selectedNote,
  noteLoading,
  showDeleteDialog,
  onCreateNew,
  onNoteClick,
  onAllNoteClick,
  onToggleSidebar: _onToggleSidebar,
  onCancel,
  onSave,
  onBackToList,
  onEdit,
  onDeleteClick,
  onDeleteConfirm,
  onDeleteCancel,
  onEditSave,
  onEditCancel,
}: MatchupTabContentProps) {
  if (!myChampionId || !enemyChampionId) {
    return <AllNotesView onNoteClick={onAllNoteClick} />;
  }
  if (viewMode === 'list') {
    return showForm ? (
      <NoteForm
        mode="create"
        myChampionId={myChampionId}
        enemyChampionId={enemyChampionId}
        onCancel={onCancel}
        onSave={onSave}
      />
    ) : (
      <NoteList
        key={refreshKey}
        myChampionId={myChampionId}
        enemyChampionId={enemyChampionId}
        onCreateNew={onCreateNew}
        onNoteClick={onNoteClick}
      />
    );
  }
  if (noteLoading)
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mx-auto mb-4"></div>
          <p className="text-gray-500">読み込み中...</p>
        </div>
      </div>
    );
  if (!selectedNote) return null;
  return (
    <NoteDetailView
      selectedNote={selectedNote}
      viewMode={viewMode as 'view' | 'edit'}
      showDeleteDialog={showDeleteDialog}
      onBackToList={onBackToList}
      onEdit={onEdit}
      onDeleteClick={onDeleteClick}
      onDeleteConfirm={onDeleteConfirm}
      onDeleteCancel={onDeleteCancel}
      onEditSave={onEditSave}
      onEditCancel={onEditCancel}
    />
  );
}
