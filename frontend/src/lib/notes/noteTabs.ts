/** ノート画面のタブ（URL のクエリ tab と同じ値） */
export const NOTE_TABS = ['matchup', 'general', 'mypick'] as const;

export type NoteTab = (typeof NOTE_TABS)[number];

/** tab を指定しなかったときのタブ */
export const DEFAULT_NOTE_TAB: NoteTab = 'matchup';
