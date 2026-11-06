import type { ParticipantDetail } from '@/types/matchDetail';
import type { Region } from '@/types/summoner';
import { COLUMN_CLASSES } from './columns';
import { ChampionCell, KdaCell, NameCell, SpellRuneCell } from './cells';

interface ParticipantIdentityCellsProps {
  participant: ParticipantDetail;
  region: Region;
}

// 行の左半分: チャンピオン・スペルとルーン・名前とランク・KDA
export function ParticipantIdentityCells({
  participant: p,
  region,
}: ParticipantIdentityCellsProps) {
  return (
    <>
      <div className={COLUMN_CLASSES.champion}>
        <ChampionCell participant={p} />
      </div>
      <div className={COLUMN_CLASSES.spells}>
        <SpellRuneCell participant={p} />
      </div>
      <div className={COLUMN_CLASSES.name}>
        <NameCell participant={p} region={region} />
      </div>
      <div className={COLUMN_CLASSES.kda}>
        <KdaCell participant={p} />
      </div>
    </>
  );
}
