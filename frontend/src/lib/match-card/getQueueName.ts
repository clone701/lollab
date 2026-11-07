const QUEUE_NAMES: Record<number, string> = {
  420: 'ランク (ソロ/デュオ)',
  440: 'ランク (フレックス)',
};

/** キューの表示名。ランク戦以外は gameMode をそのまま使う */
export function getQueueName(queueId: number, gameMode: string): string {
  return QUEUE_NAMES[queueId] ?? gameMode;
}
