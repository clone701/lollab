/** キル関与率（0〜1）の表示。整数%に四捨五入する（例: キル関与 81%） */
export function formatKillParticipation(ratio: number): string {
  return `キル関与 ${Math.round(ratio * 100)}%`;
}
