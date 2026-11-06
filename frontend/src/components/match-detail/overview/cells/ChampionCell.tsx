import Link from 'next/link';
import { BuildIcon } from '@/components/champion-build';
import { buildParticipantBuildHref, toChampionId } from '@/lib/match-detail';
import type { ParticipantDetail } from '@/types/matchDetail';

interface ChampionCellProps {
  participant: ParticipantDetail;
}

// チャンピオンのアイコン（ビルドページへのリンク）とレベル
export function ChampionCell({ participant: p }: ChampionCellProps) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <Link
        href={buildParticipantBuildHref(p)}
        aria-label={`${p.champion_name}のビルド`}
        className="rounded-full transition-colors duration-150 hover:ring-2 hover:ring-accent/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <BuildIcon
          src={`/images/champion/${toChampionId(p.champion_name)}.png`}
          label={p.champion_name}
          size={40}
          className="rounded-full"
        />
      </Link>
      <span className="text-xs text-fg-muted">Lv{p.champ_level}</span>
    </div>
  );
}
