'use client';

import { useNoteForm } from './useNoteForm';
import { NoteFormView } from './NoteFormView';
import { ChampionNote } from '@/types/note';

interface NoteFormProps {
  mode: 'create' | 'view' | 'edit';
  myChampionId: string;
  enemyChampionId: string;
  initialData?: ChampionNote;
  onCancel?: () => void;
  onSave?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function NoteForm({
  mode,
  myChampionId,
  enemyChampionId,
  initialData,
  onCancel,
  onSave,
  onEdit,
  onDelete,
}: NoteFormProps) {
  const formState = useNoteForm({
    mode,
    myChampionId,
    enemyChampionId,
    initialData,
    onSave,
  });
  return (
    <NoteFormView
      mode={mode}
      onCancel={onCancel}
      onEdit={onEdit}
      onDelete={onDelete}
      {...formState}
    />
  );
}
