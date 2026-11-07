import type { DamageMax } from '@/lib/match-detail';
import type { ParticipantDetail } from '@/types/matchDetail';
import type { Region } from '@/types/summoner';
import { ParticipantIdentityCells } from './ParticipantIdentityCells';
import { ParticipantStatCells } from './ParticipantStatCells';

interface ParticipantRowProps {
  participant: ParticipantDetail;
  /** 対象プレイヤー（検索したサモナー）の行を強調する */
  isTarget: boolean;
  region: Region;
  damageMax: DamageMax;
  durationSeconds: number;
}

// 1人の行（高さ 40px）。強調は背景と左端の印。行の区切り線は親の divide-y が引く
export function ParticipantRow({
  participant,
  isTarget,
  region,
  damageMax,
  durationSeconds,
}: ParticipantRowProps) {
  return (
    <li
      data-target={isTarget}
      className={`flex h-10 items-center gap-2 border-l-2 px-2 ${
        isTarget ? 'border-accent bg-accent/15' : 'border-transparent'
      }`}
    >
      <ParticipantIdentityCells participant={participant} region={region} />
      <ParticipantStatCells
        participant={participant}
        damageMax={damageMax}
        durationSeconds={durationSeconds}
      />
    </li>
  );
}
