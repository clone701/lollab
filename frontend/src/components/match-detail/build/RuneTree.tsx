import type { Rune } from '@/lib/data/runes';
import { RuneCell } from './RuneCell';

interface RuneTreeProps {
  label: string;
  /** ツリーの全ルーン（行ごと） */
  rows: Rune[][];
  /** 行ごとに選んだルーンの ID（同じルーンが複数行にあるシャードを行で区別する） */
  selectedRows: number[][];
}

// ツリーの全ルーンを行ごとに並べ、選んだものだけ強調する
export function RuneTree({ label, rows, selectedRows }: RuneTreeProps) {
  return (
    <div role="group" aria-label={label} className="flex flex-col gap-1">
      <h5 className="text-xs font-medium text-fg-muted">{label}</h5>
      {rows.map((runes, row) => (
        <div key={row} className="flex gap-2">
          {runes.map((rune) => (
            <RuneCell
              key={rune.id}
              rune={rune}
              isSelected={selectedRows[row]?.includes(rune.id) ?? false}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
