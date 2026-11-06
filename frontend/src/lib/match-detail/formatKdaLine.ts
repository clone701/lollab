import type { ParticipantDetail } from '@/types/matchDetail';

type KdaSource = Pick<
  ParticipantDetail,
  'kills' | 'deaths' | 'assists' | 'kill_participation'
>;

/** `キル/デス/アシスト (キル関与率%)` の形にする（例: 0/10/2 (20%)） */
export function formatKdaLine(p: KdaSource): string {
  const percent = Math.round(p.kill_participation * 100);
  return `${p.kills}/${p.deaths}/${p.assists} (${percent}%)`;
}
