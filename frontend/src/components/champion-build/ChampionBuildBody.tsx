import type { Champion } from '@/types/champion';
import type {
  BuildMode,
  BuildQuery,
  ChampionBuildResponse,
} from '@/types/championBuild';
import { BuildScope } from './BuildScope';
import { ChampionBuildHeader } from './ChampionBuildHeader';
import { ItemPanel } from './ItemPanel';
import { RunePanel } from './RunePanel';
import { SkillPanel } from './SkillPanel';
import { SpellPanel } from './SpellPanel';

interface ChampionBuildBodyProps {
  champion: Champion;
  query: BuildQuery;
  data: ChampionBuildResponse;
  mode: BuildMode;
}

export function ChampionBuildBody({
  champion,
  query,
  data,
  mode,
}: ChampionBuildBodyProps) {
  return (
    <div className="flex flex-col gap-4">
      <ChampionBuildHeader
        champion={champion}
        role={data.role}
        roles={data.roles}
        summary={data.summary}
        query={query}
      />
      <BuildScope
        games={data.summary.games}
        period={data.period}
        latestPatch={data.latest_patch}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <SkillPanel
          championId={champion.id}
          skillPriority={data.skill_priority}
          skillOrder={data.skill_order}
          mode={mode}
        />
        <SpellPanel spells={data.spells} mode={mode} />
        <ItemPanel
          startingItems={data.starting_items}
          coreItems={data.core_items}
          item4={data.item4}
          item5={data.item5}
          item6={data.item6}
          mode={mode}
        />
        <RunePanel runes={data.runes} mode={mode} />
      </div>
    </div>
  );
}
