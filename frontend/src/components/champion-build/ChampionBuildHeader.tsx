import Link from 'next/link';
import type { ChampionDetail } from '@/components/game-data';
import type { Champion } from '@/types/champion';
import { BuildIcon } from '@/components/ui/BuildIcon';
import { ChampionInfoPanel } from './champion-info';
import { ChampionTitleTags } from './ChampionTitleTags';

interface ChampionBuildHeaderProps {
  champion: Champion;
  /** 称号・役割と基礎情報に使う（useChampionDetail の結果） */
  detail: ChampionDetail;
}

export function ChampionBuildHeader({
  champion,
  detail,
}: ChampionBuildHeaderProps) {
  return (
    <div className="flex flex-col gap-3">
      <Link href="/champion" className="text-sm text-fg-muted hover:underline">
        ← チャンピオン検索に戻る
      </Link>
      <div className="flex items-center gap-4">
        <BuildIcon
          src={champion.imagePath}
          label={champion.name}
          size={64}
          className="rounded-full"
        />
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h1 className="text-xl font-bold text-fg">{champion.name}</h1>
          {detail.champion && (
            <ChampionTitleTags
              title={detail.champion.title}
              tags={detail.champion.tags}
            />
          )}
        </div>
      </div>
      <ChampionInfoPanel detail={detail} />
    </div>
  );
}
