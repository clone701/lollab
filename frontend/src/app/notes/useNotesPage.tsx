'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { ChampionNote } from '@/types/note';
import useToast from '@/lib/hooks/useToast';
import { TabType } from '@/components/notes/TabNavigation';
import { useNoteActions } from './useNoteActions';

export function useNotesPage() {
  const { user, session, loading } = useAuth();
  const { toast, showToast, hideToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('matchup');
  const [myChampionId, setMyChampionId] = useState<string | null>(null);
  const [enemyChampionId, setEnemyChampionId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [viewMode, setViewMode] = useState<'list' | 'view' | 'edit'>('list');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<ChampionNote | null>(null);
  const [noteLoading, setNoteLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { handleNoteClick, handleDeleteConfirm, handleEditSave } =
    useNoteActions({
      user,
      selectedNoteId,
      setViewMode,
      setSelectedNote,
      setSelectedNoteId,
      setNoteLoading,
      setShowDeleteDialog,
      setRefreshKey,
      showToast,
    });

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setShowForm(false);
  };
  const handleReset = () => {
    setMyChampionId(null);
    setEnemyChampionId(null);
    setShowForm(false);
    setViewMode('list');
    setSelectedNote(null);
    setSelectedNoteId(null);
  };
  const handleSave = () => {
    showToast('ノートを作成しました', 'success');
    setShowForm(false);
    setRefreshKey((p) => p + 1);
  };

  // 全ノート一覧からクリック: チャンピオン選択状態を反映してノート詳細へ
  const handleAllNoteClick = (note: ChampionNote) => {
    setMyChampionId(note.my_champion_id);
    setEnemyChampionId(note.enemy_champion_id);
    handleNoteClick(note.id);
  };

  return {
    user,
    session,
    loading,
    toast,
    hideToast,
    activeTab,
    myChampionId,
    enemyChampionId,
    sidebarOpen,
    showForm,
    refreshKey,
    viewMode,
    selectedNoteId,
    selectedNote,
    noteLoading,
    showDeleteDialog,
    handleTabChange,
    handleMyChampionChange: (id: string | null) => setMyChampionId(id),
    handleEnemyChampionChange: (id: string | null) => setEnemyChampionId(id),
    handleReset,
    handleCreateNew: () => setShowForm(true),
    handleSave,
    handleCancel: () => setShowForm(false),
    handleNoteClick,
    handleAllNoteClick,
    handleEdit: () => setViewMode('edit'),
    handleDeleteClick: () => setShowDeleteDialog(true),
    handleDeleteConfirm,
    handleDeleteCancel: () => setShowDeleteDialog(false),
    handleBackToList: () => {
      setViewMode('list');
      setSelectedNote(null);
      setSelectedNoteId(null);
    },
    handleEditSave,
    handleEditCancel: () => setViewMode('view'),
    toggleSidebar: () => setSidebarOpen((p) => !p),
    closeSidebar: () => setSidebarOpen(false),
  };
}
