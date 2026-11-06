export type MatchDetailTabId = 'overview' | 'build';

/** 試合詳細のタブ。先頭が初期表示 */
export const MATCH_DETAIL_TABS: { id: MatchDetailTabId; label: string }[] = [
  { id: 'overview', label: '概要' },
  { id: 'build', label: 'ビルド' },
];
