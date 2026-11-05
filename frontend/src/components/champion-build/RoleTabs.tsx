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

const SELECTED = 'ring-2 ring-accent bg-accent/15';
const NORMAL = 'bg-surface-2 hover:ring-2 hover:ring-accent/60';

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
            className={`rounded-lg px-3 py-1 text-sm text-fg transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${isCurrent ? SELECTED : NORMAL}`}
          >
            {ROLE_LABELS[role as Role] ?? role}
            <span className="ml-1 text-xs text-fg-muted">
              {games.toLocaleString('ja-JP')}試合
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
