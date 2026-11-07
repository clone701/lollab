'use client';

import { useRef, useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { ChampionNote } from '@/types/note';
import useToast from '@/lib/hooks/useToast';
import { TabType } from '@/components/notes/TabNavigation';
import { confirmDiscard } from '@/lib/my-pick';
import type { NotesParams } from '@/lib/notes';
import { useNoteActions } from './useNoteActions';
import { useNotesUrl } from './useNotesUrl';

export function useNotesPage() {
  const { user, session, loading } = useAuth();
  const { toast, showToast, hideToast } = useToast();
  const { params, replaceUrl } = useNotesUrl();
  const [activeTab, setActiveTab] = useState<TabType>(params.tab);
  const [myChampionId, setMyChampionId] = useState<string | null>(params.my);
  const [enemyChampionId, setEnemyChampionId] = useState<string | null>(
    params.enemy
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [viewMode, setViewMode] = useState<'list' | 'view' | 'edit'>('list');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<ChampionNote | null>(null);
  const [noteLoading, setNoteLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  // マイピックの編集中に未保存の変更があるか（タブを切り替えるときの確認に使う）
  const isPickDirtyRef = useRef(false);

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

  const resetNoteView = () => {
    setShowForm(false);
    setViewMode('list');
    setSelectedNote(null);
    setSelectedNoteId(null);
  };

  // URL のクエリが外から変わったとき（マイピックのリンクなど）は、状態を URL に合わせる。
  // 自分で更新した URL は状態と同じなので何も起きない
  const urlKey = `${params.tab}|${params.my}|${params.enemy}`;
  const [appliedUrlKey, setAppliedUrlKey] = useState(urlKey);
  if (appliedUrlKey !== urlKey) {
    setAppliedUrlKey(urlKey);
    if (
      params.tab !== activeTab ||
      params.my !== myChampionId ||
      params.enemy !== enemyChampionId
    ) {
      setActiveTab(params.tab);
      setMyChampionId(params.my);
      setEnemyChampionId(params.enemy);
      resetNoteView();
    }
  }

  // 変えたい項目だけを渡して URL を更新する（履歴は増やさない）
  const syncUrl = (next: Partial<NotesParams>) =>
    replaceUrl({
      tab: activeTab,
      my: myChampionId,
      enemy: enemyChampionId,
      ...next,
    });

  const handleTabChange = (tab: TabType) => {
    const isLeavingPick = tab !== activeTab && activeTab === 'mypick';
    if (isLeavingPick && isPickDirtyRef.current && !confirmDiscard()) return;
    setActiveTab(tab);
    setShowForm(false);
    syncUrl({ tab });
  };

  const handleMyChampionChange = (id: string | null) => {
    setMyChampionId(id);
    resetNoteView();
    syncUrl({ my: id });
  };

  const handleEnemyChampionChange = (id: string | null) => {
    setEnemyChampionId(id);
    resetNoteView();
    syncUrl({ enemy: id });
  };

  const handleReset = () => {
    setMyChampionId(null);
    setEnemyChampionId(null);
    resetNoteView();
    syncUrl({ my: null, enemy: null });
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
    syncUrl({ my: note.my_champion_id, enemy: note.enemy_champion_id });
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
    handleMyChampionChange,
    handleEnemyChampionChange,
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
    handlePickDirtyChange: (isDirty: boolean) => {
      isPickDirtyRef.current = isDirty;
    },
    toggleSidebar: () => setSidebarOpen((p) => !p),
    closeSidebar: () => setSidebarOpen(false),
  };
}
