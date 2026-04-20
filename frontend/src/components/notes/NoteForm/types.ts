import { RuneConfig, ChampionNote } from '@/types/note';
import useToast from '@/lib/hooks/useToast';

export interface UseNoteFormReturn {
  presetName: string;
  runes: RuneConfig | null;
  runeKey: number;
  spells: string[];
  items: string[];
  memo: string;
  errors: Record<string, string>;
  saving: boolean;
  toast: ReturnType<typeof useToast>['toast'];
  setPresetName: (v: string) => void;
  setRunes: (v: RuneConfig | null) => void;
  setSpells: (v: string[]) => void;
  setItems: (v: string[]) => void;
  setMemo: (v: string) => void;
  handleSave: () => Promise<void>;
  handleRuneReset: () => void;
  handleCancel: () => void;
  hideToast: () => void;
}

export interface UseNoteFormProps {
  mode: 'create' | 'view' | 'edit';
  myChampionId: string;
  enemyChampionId: string;
  initialData?: ChampionNote;
  onSave?: () => void;
}

export interface NoteFormFieldsProps {
  mode: 'create' | 'view' | 'edit';
  presetName: string;
  runes: RuneConfig | null;
  runeKey: number;
  spells: string[];
  items: string[];
  memo: string;
  errors: Record<string, string>;
  setPresetName: (v: string) => void;
  setRunes: (v: RuneConfig | null) => void;
  setSpells: (v: string[]) => void;
  setItems: (v: string[]) => void;
  setMemo: (v: string) => void;
  handleRuneReset: () => void;
}
