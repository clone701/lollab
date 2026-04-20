import { ChampionNote } from '@/types/note';
import { TabType } from '@/components/notes/TabNavigation';

export interface NotesPageContentProps {
  activeTab: TabType;
  myChampionId: string | null;
  enemyChampionId: string | null;
  sidebarOpen: boolean;
  showForm: boolean;
  refreshKey: number;
  viewMode: 'list' | 'view' | 'edit';
  selectedNote: ChampionNote | null;
  noteLoading: boolean;
  showDeleteDialog: boolean;
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  onTabChange: (tab: TabType) => void;
  onMyChampionChange: (id: string | null) => void;
  onEnemyChampionChange: (id: string | null) => void;
  onReset: () => void;
  onCloseSidebar: () => void;
  onToggleSidebar: () => void;
  onHideToast: () => void;
  onCreateNew: () => void;
  onNoteClick: (id: number) => void;
  onAllNoteClick: (note: ChampionNote) => void;
  onCancel: () => void;
  onSave: () => void;
  onBackToList: () => void;
  onEdit: () => void;
  onDeleteClick: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
  onEditSave: () => void;
  onEditCancel: () => void;
}

export interface MatchupTabContentProps {
  myChampionId: string | null;
  enemyChampionId: string | null;
  showForm: boolean;
  refreshKey: number;
  viewMode: 'list' | 'view' | 'edit';
  selectedNote: ChampionNote | null;
  noteLoading: boolean;
  showDeleteDialog: boolean;
  onCreateNew: () => void;
  onNoteClick: (id: number) => void;
  onAllNoteClick: (note: ChampionNote) => void;
  onToggleSidebar: () => void;
  onCancel: () => void;
  onSave: () => void;
  onBackToList: () => void;
  onEdit: () => void;
  onDeleteClick: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
  onEditSave: () => void;
  onEditCancel: () => void;
}
