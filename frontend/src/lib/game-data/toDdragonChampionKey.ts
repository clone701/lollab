/** 画面の ID（champions.ts の id）を、Data Dragon のチャンピオンのファイル名にする */
export function toDdragonChampionKey(id: string): string {
  return id === 'Wukong' ? 'MonkeyKing' : id;
}
