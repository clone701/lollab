import { NoData } from '@/components/champion-build';
import { getChampionLabel } from '@/lib/champion-stats';
import { getDisplayName } from '@/lib/match-detail';
import type { ParticipantDetail } from '@/types/matchDetail';
import { BuildSection } from './BuildSection';
import { ItemTimeline } from './ItemTimeline';
import { RuneTreeView } from './RuneTreeView';
import { SkillOrderView } from './SkillOrderView';

interface BuildDetailsProps {
  participant: ParticipantDetail;
}

// 選んだプレイヤー1人分のビルド。タイムラインがなければアイテムとスキルは「データなし」
export function BuildDetails({ participant: p }: BuildDetailsProps) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-bold text-fg">
        {getDisplayName(p)}
        <span className="ml-2 font-medium text-fg-muted">
          {getChampionLabel(p.champion_name)}
        </span>
      </h3>
      <BuildSection title="アイテムの購入順">
        {p.build ? (
          <ItemTimeline groups={p.build.item_purchases} />
        ) : (
          <NoData />
        )}
      </BuildSection>
      <BuildSection title="スキル">
        {p.build ? <SkillOrderView build={p.build} /> : <NoData />}
      </BuildSection>
      <BuildSection title="ルーン">
        <RuneTreeView participant={p} />
      </BuildSection>
    </div>
  );
}
