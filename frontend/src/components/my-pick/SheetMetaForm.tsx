'use client';

import type { PickLane } from '@/types/myPick';
import { LANE_LABELS, PICK_LANES, validateSheetName } from '@/lib/my-pick';

interface SheetMetaFormProps {
  name: string;
  lane: PickLane;
  onNameChange: (name: string) => void;
  onLaneChange: (lane: PickLane) => void;
  /** 名前のエラーを表示するか（未入力の初期状態では出さない） */
  shouldShowError: boolean;
  /** 入力欄の id の接頭辞（同じ画面に複数置いても重ならないようにする） */
  idPrefix: string;
}

const FIELD =
  'rounded border border-line bg-surface-2 px-3 py-2 text-sm text-fg hover:border-line-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-accent';

// 表の名前とレーンの入力欄
export function SheetMetaForm(p: SheetMetaFormProps) {
  const { error } = validateSheetName(p.name);
  return (
    <div className="flex flex-wrap items-start gap-3">
      <div className="min-w-48 flex-1">
        <label htmlFor={`${p.idPrefix}-name`} className="text-xs text-fg-muted">
          表の名前
        </label>
        <input
          id={`${p.idPrefix}-name`}
          type="text"
          value={p.name}
          onChange={(e) => p.onNameChange(e.target.value)}
          aria-invalid={p.shouldShowError && error !== null}
          className={`mt-1 w-full ${FIELD}`}
        />
        {p.shouldShowError && error && (
          <p role="alert" className="mt-1 text-xs text-danger-fg">
            {error}
          </p>
        )}
      </div>
      <div>
        <label htmlFor={`${p.idPrefix}-lane`} className="text-xs text-fg-muted">
          レーン
        </label>
        <select
          id={`${p.idPrefix}-lane`}
          value={p.lane}
          onChange={(e) => p.onLaneChange(e.target.value as PickLane)}
          className={`mt-1 block ${FIELD}`}
        >
          {PICK_LANES.map((lane) => (
            <option key={lane} value={lane}>
              {LANE_LABELS[lane]}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
