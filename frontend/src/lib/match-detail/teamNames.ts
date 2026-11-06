export const BLUE_TEAM_ID = 100;
export const RED_TEAM_ID = 200;

/** チーム ID → 表示名 */
export function teamName(teamId: number): string {
  if (teamId === BLUE_TEAM_ID) return 'ブルーチーム';
  if (teamId === RED_TEAM_ID) return 'レッドチーム';
  return `チーム${teamId}`;
}
