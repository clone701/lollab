'use client';

import { Dispatch, SetStateAction } from 'react';
import { ChampionNote } from '@/types/note';
import { fetchNoteById, deleteNote } from '@/adapters/supabase';

interface UseNoteActionsProps {
  user: { id: string } | null;
  selectedNoteId: string | null;
  setViewMode: Dispatch<SetStateAction<'list' | 'view' | 'edit'>>;
  setSelectedNote: Dispatch<SetStateAction<ChampionNote | null>>;
  setSelectedNoteId: Dispatch<SetStateAction<string | null>>;
  setNoteLoading: Dispatch<SetStateAction<boolean>>;
  setShowDeleteDialog: Dispatch<SetStateAction<boolean>>;
  setRefreshKey: Dispatch<SetStateAction<number>>;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

export function useNoteActions({
  user,
  selectedNoteId,
  setViewMode,
  setSelectedNote,
  setSelectedNoteId,
  setNoteLoading,
  setShowDeleteDialog,
  setRefreshKey,
  showToast,
}: UseNoteActionsProps) {
  const handleNoteClick = async (noteId: number) => {
    if (!user) return;
    setNoteLoading(true);
    try {
      const note = await fetchNoteById(noteId.toString(), user.id);
      if (note) {
        setSelectedNote(note);
        setSelectedNoteId(noteId.toString());
        setViewMode('view');
      }
    } catch (e) {
      console.error('Failed to fetch note:', e);
    } finally {
      setNoteLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!user || !selectedNoteId) return;
    try {
      await deleteNote(selectedNoteId, user.id);
      showToast('ノートを削除しました', 'success');
      setShowDeleteDialog(false);
      setViewMode('list');
      setSelectedNote(null);
      setSelectedNoteId(null);
      setRefreshKey((p) => p + 1);
    } catch (e) {
      console.error('Failed to delete note:', e);
      showToast('ノートの削除に失敗しました', 'error');
      setShowDeleteDialog(false);
    }
  };

  const handleEditSave = () => {
    if (selectedNoteId && user) {
      fetchNoteById(selectedNoteId, user.id).then((note) => {
        if (note) {
          setSelectedNote(note);
          setViewMode('view');
        }
      });
    }
  };

  return { handleNoteClick, handleDeleteConfirm, handleEditSave };
}
