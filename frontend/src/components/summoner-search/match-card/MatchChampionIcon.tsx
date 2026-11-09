import { BuildIcon } from '@/components/champion-build';
import { getChampionLabel } from '@/lib/champion-stats';
import { toChampionId } from '@/lib/match-detail';

interface MatchChampionIconProps {
  championName: string;
}

// チャンピオンアイコン（Riot の名前を画像の ID に直す。ウーコンなど名前が違うもの用）
export function MatchChampionIcon({ championName }: MatchChampionIconProps) {
  return (
    <BuildIcon
      src={`/images/champion/${toChampionId(championName)}.png`}
      label={getChampionLabel(championName)}
      size={48}
      className="rounded-full bg-surface-2"
    />
  );
}
