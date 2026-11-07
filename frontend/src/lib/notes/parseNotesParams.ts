import { getChampionById } from '@/lib/data/champions';
import { DEFAULT_NOTE_TAB, NOTE_TABS, type NoteTab } from './noteTabs';

export interface NotesParams {
  tab: NoteTab;
  my: string | null;
  enemy: string | null;
}

function toChampionId(value: string | null): string | null {
  return value && getChampionById(value) ? value : null;
}

/**
 * ノート画面の URL クエリ（tab・my・enemy）を検証する。
 * 不正な tab は既定のタブ、champions.ts にない id は null にする。
 */
export function parseNotesParams(
  tab: string | null,
  my: string | null,
  enemy: string | null
): NotesParams {
  const validTab = NOTE_TABS.find((t) => t === tab) ?? DEFAULT_NOTE_TAB;
  return { tab: validTab, my: toChampionId(my), enemy: toChampionId(enemy) };
}
