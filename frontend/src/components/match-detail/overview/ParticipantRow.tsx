import type { DamageMax } from '@/lib/match-detail';
import type { ParticipantDetail } from '@/types/matchDetail';
import type { Region } from '@/types/summoner';
import { ParticipantIdentityCells } from './ParticipantIdentityCells';
import { ParticipantStatCells } from './ParticipantStatCells';

interface ParticipantRowProps {
  participant: ParticipantDetail;
  /** 対象プレイヤー（検索したサモナー）の行は強調する */
  isTarget: boolean;
  region: Region;
  damageMax: DamageMax;
  durationSeconds: number;
}

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
      className={`flex items-center gap-2 rounded p-2 ${
        isTarget ? 'ring-2 ring-accent bg-accent/15' : ''
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
