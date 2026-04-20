'use client';

import TabNavigation from '@/components/notes/TabNavigation';
import TabContentPlaceholder from '@/components/notes/TabContentPlaceholder';
import Toast from '@/components/ui/Toast';
import { MatchupTabContent } from './MatchupTabContent';
import { GeneralNoteTabContent } from './GeneralNoteTabContent';
import { SidebarLayout } from './SidebarLayout';
import { NotesPageContentProps } from './types';

export function NotesPageContent(p: NotesPageContentProps) {
  const shouldShowSidebar = p.activeTab === 'matchup';
  return (
    <div className="min-h-screen">
      <TabNavigation activeTab={p.activeTab} onTabChange={p.onTabChange} />
      <div className="flex">
        {shouldShowSidebar && (
          <SidebarLayout
            myChampionId={p.myChampionId}
            enemyChampionId={p.enemyChampionId}
            sidebarOpen={p.sidebarOpen}
            onMyChampionChange={p.onMyChampionChange}
            onEnemyChampionChange={p.onEnemyChampionChange}
            onReset={p.onReset}
            onCloseSidebar={p.onCloseSidebar}
          />
        )}
        <div className="flex-1 min-h-screen">
          {p.activeTab === 'matchup' && (
            <div className="p-6 max-w-5xl mx-auto">
              <MatchupTabContent
                myChampionId={p.myChampionId}
                enemyChampionId={p.enemyChampionId}
                showForm={p.showForm}
                refreshKey={p.refreshKey}
                viewMode={p.viewMode}
                selectedNote={p.selectedNote}
                noteLoading={p.noteLoading}
                showDeleteDialog={p.showDeleteDialog}
                onCreateNew={p.onCreateNew}
                onNoteClick={p.onNoteClick}
                onAllNoteClick={p.onAllNoteClick}
                onToggleSidebar={p.onToggleSidebar}
                onCancel={p.onCancel}
                onSave={p.onSave}
                onBackToList={p.onBackToList}
                onEdit={p.onEdit}
                onDeleteClick={p.onDeleteClick}
                onDeleteConfirm={p.onDeleteConfirm}
                onDeleteCancel={p.onDeleteCancel}
                onEditSave={p.onEditSave}
                onEditCancel={p.onEditCancel}
              />
            </div>
          )}
          {p.activeTab === 'general' && (
            <div className="h-screen flex flex-col">
              <GeneralNoteTabContent />
            </div>
          )}
          {p.activeTab !== 'matchup' && p.activeTab !== 'general' && (
            <TabContentPlaceholder
              tab={p.activeTab}
              myChampionId={p.myChampionId}
              enemyChampionId={p.enemyChampionId}
            />
          )}
        </div>
      </div>
      {p.toast && (
        <Toast
          message={p.toast.message}
          type={p.toast.type}
          onClose={p.onHideToast}
        />
      )}
      {shouldShowSidebar && (
        <button
          onClick={p.onToggleSidebar}
          className="md:hidden fixed bottom-4 right-4 z-40 bg-gray-800 text-white p-4 rounded-full shadow-lg hover:bg-gray-700 transition-colors duration-150"
          aria-label="チャンピオン選択メニューを開く"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
