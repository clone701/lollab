import Link from 'next/link';
import type { Champion } from '@/types/champion';
import type { BuildQuery, ChampionBuildResponse } from '@/types/championBuild';
import { BuildIcon } from './BuildIcon';
import { RoleTabs } from './RoleTabs';
import { SummaryStats } from './SummaryStats';

interface ChampionBuildHeaderProps {
  champion: Champion;
  role: ChampionBuildResponse['role'];
  roles: ChampionBuildResponse['roles'];
  summary: ChampionBuildResponse['summary'];
  query: BuildQuery;
}

export function ChampionBuildHeader({
  champion,
  role,
  roles,
  summary,
  query,
}: ChampionBuildHeaderProps) {
  return (
    <div className="flex flex-col gap-3">
      <Link href="/champion" className="text-sm text-gray-600 hover:underline">
        ← チャンピオン検索に戻る
      </Link>
      <div className="flex items-center gap-4">
        <BuildIcon
          src={champion.imagePath}
          label={champion.name}
          size={64}
          className="rounded-full"
        />
        <h1 className="text-xl font-bold text-gray-800">{champion.name}</h1>
      </div>
      <RoleTabs
        championId={champion.id}
        roles={roles}
        currentRole={role}
        query={query}
      />
      <SummaryStats summary={summary} />
    </div>
  );
}
