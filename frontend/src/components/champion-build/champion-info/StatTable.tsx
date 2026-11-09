import type { StatRow } from '@/lib/champion-info';

const HEADERS = ['ステータス', 'Lv.1', '成長', 'Lv.18'];

interface StatTableProps {
  rows: StatRow[];
}

// ステータス表。行を前半と後半に分けて2列に並べる（狭い画面は1列）
export function StatTable({ rows }: StatTableProps) {
  const half = Math.ceil(rows.length / 2);
  const columns = [rows.slice(0, half), rows.slice(half)];
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {columns
        .filter((column) => column.length > 0)
        .map((column, i) => (
          <table key={i} className="w-full self-start text-sm">
            <caption className="sr-only">ステータス</caption>
            <thead>
              <tr className="bg-surface-2 text-fg-muted">
                {HEADERS.map((header, j) => (
                  <th
                    key={header}
                    scope="col"
                    className={`p-2 font-medium ${j === 0 ? 'text-left' : 'text-right'}`}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {column.map((row) => (
                <tr key={row.label} className="border-b border-line">
                  <th scope="row" className="p-2 text-left font-medium text-fg">
                    {row.label}
                  </th>
                  <td className="p-2 text-right text-fg">{row.base}</td>
                  <td className="p-2 text-right text-fg-subtle">
                    {row.growth ?? '-'}
                  </td>
                  <td className="p-2 text-right font-semibold text-game-number">
                    {row.max ?? '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ))}
    </div>
  );
}
