const ROLE_LABELS: Record<string, string> = {
  Fighter: 'ファイター',
  Tank: 'タンク',
  Mage: 'メイジ',
  Assassin: 'アサシン',
  Marksman: 'マークスマン',
  Support: 'サポート',
};

/** Data Dragon の tags の値を日本語の役割名にする。知らない値はそのまま */
export function toRoleLabel(tag: string): string {
  return Object.hasOwn(ROLE_LABELS, tag) ? ROLE_LABELS[tag] : tag;
}
