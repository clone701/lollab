import Link from 'next/link';
import { BuildIcon } from '@/components/champion-build';
import { buildParticipantBuildHref, toChampionId } from '@/lib/match-detail';
import type { ParticipantDetail } from '@/types/matchDetail';

interface ChampionCellProps {
  participant: ParticipantDetail;
}

// チャンピオンのアイコン（ビルドページへのリンク）。レベルは右下に小さなバッジで重ねる
export function ChampionCell({ participant: p }: ChampionCellProps) {
  return (
    <div className="relative h-8 w-8">
      <Link
        href={buildParticipantBuildHref(p)}
        aria-label={`${p.champion_name}のビルド`}
        className="block rounded-full transition-colors duration-150 hover:ring-2 hover:ring-accent/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <BuildIcon
          src={`/images/champion/${toChampionId(p.champion_name)}.png`}
          label={p.champion_name}
          size={32}
          className="rounded-full"
        />
      </Link>
      <span className="pointer-events-none absolute -bottom-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full border border-line bg-canvas px-0.5 text-xs leading-none text-fg">
        <span className="sr-only">Lv</span>
        {p.champ_level}
      </span>
    </div>
  );
}
