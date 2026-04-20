'use client';

import Image from 'next/image';
import NoteForm from '@/components/notes/NoteForm';
import DeleteConfirmationDialog from '@/components/notes/DeleteConfirmationDialog';
import { ChampionNote } from '@/types/note';
import { getChampionById } from '@/lib/utils/championHelpers';

interface NoteDetailViewProps {
  selectedNote: ChampionNote;
  viewMode: 'view' | 'edit';
  showDeleteDialog: boolean;
  onBackToList: () => void;
  onEdit: () => void;
  onDeleteClick: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
  onEditSave: () => void;
  onEditCancel: () => void;
}

export function NoteDetailView({
  selectedNote,
  viewMode,
  showDeleteDialog,
  onBackToList,
  onEdit,
  onDeleteClick,
  onDeleteConfirm,
  onDeleteCancel,
  onEditSave,
  onEditCancel,
}: NoteDetailViewProps) {
  const myChampion = getChampionById(selectedNote.my_champion_id);
  const enemyChampion = getChampionById(selectedNote.enemy_champion_id);
  return (
    <div>
      <button
        onClick={onBackToList}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors"
        aria-label="一覧へ戻る"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        <span className="text-sm font-medium">一覧へ戻る</span>
      </button>
      <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <Image
            src={`/images/champion/${myChampion?.id}.png`}
            alt={myChampion?.name || ''}
            width={48}
            height={48}
            className="rounded-full"
          />
          <span className="text-sm font-medium text-gray-700">
            {myChampion?.name}
          </span>
        </div>
        <span className="text-gray-400 text-xl">VS</span>
        <div className="flex items-center gap-2">
          <Image
            src={`/images/champion/${enemyChampion?.id}.png`}
            alt={enemyChampion?.name || ''}
            width={48}
            height={48}
            className="rounded-full"
          />
          <span className="text-sm font-medium text-gray-700">
            {enemyChampion?.name}
          </span>
        </div>
      </div>
      <NoteForm
        mode={viewMode === 'view' ? 'view' : 'edit'}
        myChampionId={selectedNote.my_champion_id}
        enemyChampionId={selectedNote.enemy_champion_id}
        initialData={selectedNote}
        onEdit={onEdit}
        onDelete={onDeleteClick}
        onSave={onEditSave}
        onCancel={onEditCancel}
      />
      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        onConfirm={onDeleteConfirm}
        onCancel={onDeleteCancel}
      />
    </div>
  );
}
