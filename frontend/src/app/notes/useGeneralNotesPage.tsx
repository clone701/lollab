'use client';

import { useState } from 'react';
import { GeneralNote, GeneralNoteFormData } from '@/types/generalNote';
import {
  createGeneralNote,
  updateGeneralNote,
  deleteGeneralNote,
  getGeneralNotes,
} from '@/adapters/supabase';

export type GeneralViewMode = 'list' | 'view' | 'edit' | 'create';

export function useGeneralNotesPage() {
  const [viewMode, setViewMode] = useState<GeneralViewMode>('list');
  const [selectedNote, setSelectedNote] = useState<GeneralNote | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [noteLoading, setNoteLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleCreateNew = () => setViewMode('create');

  const handleNoteClick = async (noteId: number) => {
    setNoteLoading(true);
    try {
      const notes = await getGeneralNotes();
      const note = notes.find((n) => n.id === noteId) ?? null;
      setSelectedNote(note);
      setViewMode('view');
    } finally {
      setNoteLoading(false);
    }
  };

  const handleEdit = () => setViewMode('edit');
  const handleDeleteClick = () => setShowDeleteDialog(true);
  const handleDeleteCancel = () => setShowDeleteDialog(false);

  const handleDeleteConfirm = async () => {
    if (!selectedNote) return;
    await deleteGeneralNote(selectedNote.id);
    setViewMode('list');
    setSelectedNote(null);
    setRefreshKey((k) => k + 1);
    setShowDeleteDialog(false);
  };

  const handleSave = async (data: GeneralNoteFormData) => {
    if (viewMode === 'edit' && selectedNote) {
      const updated = await updateGeneralNote(selectedNote.id, data);
      setSelectedNote(updated);
      setViewMode('view');
    } else {
      await createGeneralNote(data);
      setViewMode('list');
    }
    setRefreshKey((k) => k + 1);
  };

  const handleCancel = () => setViewMode(viewMode === 'edit' ? 'view' : 'list');

  return {
    viewMode,
    selectedNote,
    refreshKey,
    noteLoading,
    showDeleteDialog,
    handleCreateNew,
    handleNoteClick,
    handleEdit,
    handleDeleteClick,
    handleDeleteCancel,
    handleDeleteConfirm,
    handleSave,
    handleCancel,
  };
}
