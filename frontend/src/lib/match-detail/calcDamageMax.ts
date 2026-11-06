import type { ParticipantDetail } from '@/types/matchDetail';

export interface DamageMax {
  dealt: number;
  taken: number;
}

/** 試合内（10人）の与ダメージ・受けたダメージの最大値 */
export function calcDamageMax(participants: ParticipantDetail[]): DamageMax {
  return participants.reduce<DamageMax>(
    (max, p) => ({
      dealt: Math.max(max.dealt, p.damage_to_champions),
      taken: Math.max(max.taken, p.damage_taken),
    }),
    { dealt: 0, taken: 0 }
  );
}
