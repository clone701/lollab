'use client';

import GlobalLoading from '@/components/GlobalLoading';
import { useNotesPage } from './useNotesPage';
import { NotesPageContent } from './NotesPageContent';

export default function NotesPage() {
  const state = useNotesPage();

  if (state.loading) return <GlobalLoading loading={true} />;

  if (!state.session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            ログインが必要です
          </h2>
          <p className="text-gray-600">
            ノート機能を利用するには、ログインしてください。
          </p>
        </div>
      </div>
    );
  }

  return (
    <NotesPageContent
      activeTab={state.activeTab}
      myChampionId={state.myChampionId}
      enemyChampionId={state.enemyChampionId}
      sidebarOpen={state.sidebarOpen}
      showForm={state.showForm}
      refreshKey={state.refreshKey}
      viewMode={state.viewMode}
      selectedNote={state.selectedNote}
      noteLoading={state.noteLoading}
      showDeleteDialog={state.showDeleteDialog}
      toast={state.toast}
      onTabChange={state.handleTabChange}
      onMyChampionChange={state.handleMyChampionChange}
      onEnemyChampionChange={state.handleEnemyChampionChange}
      onReset={state.handleReset}
      onCloseSidebar={state.closeSidebar}
      onToggleSidebar={state.toggleSidebar}
      onHideToast={state.hideToast}
      onCreateNew={state.handleCreateNew}
      onNoteClick={state.handleNoteClick}
      onAllNoteClick={state.handleAllNoteClick}
      onCancel={state.handleCancel}
      onSave={state.handleSave}
      onBackToList={state.handleBackToList}
      onEdit={state.handleEdit}
      onDeleteClick={state.handleDeleteClick}
      onDeleteConfirm={state.handleDeleteConfirm}
      onDeleteCancel={state.handleDeleteCancel}
      onEditSave={state.handleEditSave}
      onEditCancel={state.handleEditCancel}
    />
  );
}
