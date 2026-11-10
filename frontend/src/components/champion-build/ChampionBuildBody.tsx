import { useChampionDetail } from '@/components/game-data';
import type { Champion } from '@/types/champion';
import type { BuildQuery, ChampionBuildResponse } from '@/types/championBuild';
import { BuildStatsCard } from './BuildStatsCard';
import { ChampionBuildHeader } from './ChampionBuildHeader';
import { ItemPanel } from './ItemPanel';
import { RunePanel } from './RunePanel';
import { SkillPanel } from './SkillPanel';
import { SpellPanel } from './SpellPanel';

interface ChampionBuildBodyProps {
  champion: Champion;
  query: BuildQuery;
  /** 読み込み中・エラーのときは null。カードにはフィルターだけを出し、パネルは出さない */
  data: ChampionBuildResponse | null;
  /** カードの下に出す読み込み中・エラーの表示 */
  children?: React.ReactNode;
}

export function ChampionBuildBody({
  champion,
  query,
  data,
  children,
}: ChampionBuildBodyProps) {
  // スキルと基礎情報で同じデータを使うため、ここで1回だけ取る
  const detail = useChampionDetail(champion.id);
  // 条件が変わったらルーンの1番目/2番目の選択を初期化する
  const runeKey = `${champion.id}|${data?.role ?? ''}|${query.period}|${query.queue}|${query.rank}`;
  return (
    <div className="flex flex-col gap-4">
      <ChampionBuildHeader champion={champion} detail={detail} />
      <BuildStatsCard championId={champion.id} query={query} data={data} />
      {children}
      {data && (
        <div className="grid gap-4 md:grid-cols-2">
          <SkillPanel
            skills={detail.skills}
            skillPriority={data.skill_priority}
            skillOrder={data.skill_order}
          />
          <SpellPanel spells={data.spells} />
          <ItemPanel
            startingItems={data.starting_items}
            coreItems={data.core_items}
            item4={data.item4}
            item5={data.item5}
            item6={data.item6}
          />
          <RunePanel key={runeKey} runes={data.runes} />
        </div>
      )}
    </div>
  );
}
