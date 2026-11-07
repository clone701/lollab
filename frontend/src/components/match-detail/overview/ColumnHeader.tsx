import { COLUMNS, COLUMN_CLASSES } from './columns';

// 行の左端の印（border-l-2）と同じ幅の透明な枠で、列の位置をそろえる
export function ColumnHeader() {
  return (
    <div
      aria-hidden="true"
      className="flex items-center gap-2 border-l-2 border-transparent px-2 pb-1 text-xs text-fg-subtle"
    >
      {COLUMNS.map((c) => (
        <span
          key={c.key}
          className={`${COLUMN_CLASSES[c.key]} whitespace-nowrap`}
        >
          {c.label}
        </span>
      ))}
    </div>
  );
}
