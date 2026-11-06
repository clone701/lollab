import { COLUMNS, COLUMN_CLASSES } from './columns';

export function ColumnHeader() {
  return (
    <div
      aria-hidden="true"
      className="flex items-center gap-2 px-2 pb-1 text-xs text-fg-subtle"
    >
      {COLUMNS.map((c) => (
        <span key={c.key} className={COLUMN_CLASSES[c.key]}>
          {c.label}
        </span>
      ))}
    </div>
  );
}
