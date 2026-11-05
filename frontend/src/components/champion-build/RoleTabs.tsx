import Link from 'next/link';
import { ROLE_LABELS, buildChampionBuildHref } from '@/lib/champion-build';
import type { BuildQuery, Role } from '@/types/championBuild';

interface RoleTabsProps {
  championId: string;
  /** 応答の roles（ロール名 → 試合数）。ここにあるロールだけを並べる */
  roles: Record<string, number>;
  currentRole: string | null;
  query: BuildQuery;
}

const SELECTED = 'ring-2 ring-blue-500 shadow-md shadow-blue-500/20 bg-blue-50';
const NORMAL = 'bg-gray-50 hover:ring-2 hover:ring-blue-400';

export function RoleTabs({
  championId,
  roles,
  currentRole,
  query,
}: RoleTabsProps) {
  const entries = Object.entries(roles);
  if (entries.length === 0) return null;
  return (
    <nav aria-label="ロール" className="flex flex-wrap gap-2">
      {entries.map(([role, games]) => {
        const href = buildChampionBuildHref(championId, {
          ...query,
          role: role as Role,
        });
        const isCurrent = role === currentRole;
        return (
          <Link
            key={role}
            href={href}
            aria-current={isCurrent ? 'page' : undefined}
            className={`rounded-lg px-3 py-1 text-sm text-gray-800 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${isCurrent ? SELECTED : NORMAL}`}
          >
            {ROLE_LABELS[role as Role] ?? role}
            <span className="ml-1 text-xs text-gray-500">
              {games.toLocaleString('ja-JP')}試合
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
