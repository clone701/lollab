import Image from 'next/image';

interface MatchChampionIconProps {
  championName: string;
}

// チャンピオンアイコン
export function MatchChampionIcon({ championName }: MatchChampionIconProps) {
  return (
    <div className="w-10 h-10 rounded-full bg-surface-2 overflow-hidden flex-shrink-0">
      <Image
        src={`/images/champion/${championName}.png`}
        alt={championName}
        width={40}
        height={40}
        className="object-cover"
        onError={() => {}}
      />
    </div>
  );
}
