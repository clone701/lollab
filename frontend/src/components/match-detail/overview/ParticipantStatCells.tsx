import type { DamageMax } from '@/lib/match-detail';
import type { ParticipantDetail } from '@/types/matchDetail';
import { COLUMN_CLASSES } from './columns';
import { CsCell, ItemsCell, WardCell } from './cells';
import { DamageBar } from './DamageBar';

interface ParticipantStatCellsProps {
  participant: ParticipantDetail;
  damageMax: DamageMax;
  durationSeconds: number;
}

// 行の右半分: ダメージ・ワード・CS・アイテム
export function ParticipantStatCells({
  participant: p,
  damageMax,
  durationSeconds,
}: ParticipantStatCellsProps) {
  return (
    <>
      <div className={COLUMN_CLASSES.damage}>
        <DamageBar
          label="与ダメージ"
          value={p.damage_to_champions}
          max={damageMax.dealt}
          barClassName="bg-accent"
        />
      </div>
      <div className={COLUMN_CLASSES.taken}>
        <DamageBar
          label="被ダメージ"
          value={p.damage_taken}
          max={damageMax.taken}
          barClassName="bg-fg-subtle"
        />
      </div>
      <div className={COLUMN_CLASSES.ward}>
        <WardCell participant={p} />
      </div>
      <div className={COLUMN_CLASSES.cs}>
        <CsCell participant={p} durationSeconds={durationSeconds} />
      </div>
      <div className={COLUMN_CLASSES.items}>
        <ItemsCell itemIds={p.item_ids} />
      </div>
    </>
  );
}
