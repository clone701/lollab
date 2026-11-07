import type { NoteTab } from './noteTabs';

interface NotesHrefParams {
  tab: NoteTab;
  /** 自分のチャンピオンの id */
  my?: string | null;
  /** 相手のチャンピオンの id */
  enemy?: string | null;
}

/** ノート画面の URL を作る（`/notes?tab=matchup&my=Ahri&enemy=Zed`）。未指定の my・enemy は含めない */
export function buildNotesHref({ tab, my, enemy }: NotesHrefParams): string {
  const params = new URLSearchParams({ tab });
  if (my) params.set('my', my);
  if (enemy) params.set('enemy', enemy);
  return `/notes?${params.toString()}`;
}
