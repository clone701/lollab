import { RuneConfig, ChampionNote } from '@/types/note';

export interface NoteFormValues {
  presetName: string;
  runes: RuneConfig | null;
  spells: string[];
  items: string[];
  memo: string;
}

// 保存済みノートからフォームの初期値を作る（ノートが無ければ空のフォーム）
export function getInitialFormValues(
  initialData?: ChampionNote
): NoteFormValues {
  return {
    presetName: initialData?.preset_name || '',
    runes: initialData?.runes ?? null,
    spells: initialData?.spells || [],
    items: initialData?.items || [],
    memo: initialData?.memo || '',
  };
}
