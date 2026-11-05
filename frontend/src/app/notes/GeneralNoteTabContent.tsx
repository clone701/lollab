'use client';

import { GeneralNoteList } from '@/components/notes/GeneralNoteList';
import { GeneralNoteForm } from '@/components/notes/GeneralNoteForm';
import { GeneralNoteDetail } from '@/components/notes/GeneralNoteDetail';
import { AllGeneralNotesView } from './AllGeneralNotesView';
import { useGeneralNotesPage } from './useGeneralNotesPage';

export function GeneralNoteTabContent() {
  const {
    viewMode,
    selectedNote,
    refreshKey,
    showDeleteDialog,
    handleCreateNew,
    handleNoteClick,
    handleEdit,
    handleDeleteClick,
    handleDeleteCancel,
    handleDeleteConfirm,
    handleSave,
    handleCancel,
  } = useGeneralNotesPage();

  const renderRight = () => {
    if (viewMode === 'create') {
      return (
        <GeneralNoteForm
          mode="create"
          onSave={handleSave}
          onCancel={handleCancel}
        />
      );
    }
    if (viewMode === 'view' && selectedNote) {
      return (
        <GeneralNoteDetail
          note={selectedNote}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
        />
      );
    }
    if (viewMode === 'edit' && selectedNote) {
      return (
        <GeneralNoteForm
          mode="edit"
          initialData={selectedNote}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      );
    }
    return (
      <AllGeneralNotesView
        onNoteClick={handleNoteClick}
        refreshKey={refreshKey}
      />
    );
  };

  return (
    <div className="flex h-full min-h-0">
      <div className="w-80 shrink-0 border-r border-line overflow-y-auto p-4 bg-surface">
        <GeneralNoteList
          refreshKey={refreshKey}
          onCreateNew={handleCreateNew}
          onNoteClick={handleNoteClick}
        />
      </div>
      <div className="flex-1 overflow-y-auto bg-canvas p-4 flex flex-col">
        {showDeleteDialog && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-surface rounded-lg p-6 shadow-lg max-w-sm w-full mx-4">
              <p className="text-sm text-fg-muted mb-4">
                このノートを削除しますか？
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={handleDeleteCancel}
                  className="px-4 py-2 text-sm border border-line rounded hover:bg-surface-2"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 text-sm bg-danger text-white rounded hover:bg-danger-hover"
                >
                  削除
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="bg-surface rounded-xl shadow-sm border border-line flex-1 flex flex-col">
          {renderRight()}
        </div>
      </div>
    </div>
  );
}
