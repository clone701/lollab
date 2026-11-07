import Link from 'next/link';
import type { Champion } from '@/types/champion';
import { BuildIcon } from '@/components/champion-build';
import { buildNotesHref } from '@/lib/notes';

interface PickLinkProps {
  pick: Champion;
  enemy: Champion;
}

// 自分のピックのアイコン。「ピック vs 相手」の対策ノートへのリンク
export function PickLink({ pick, enemy }: PickLinkProps) {
  return (
    <Link
      href={buildNotesHref({ tab: 'matchup', my: pick.id, enemy: enemy.id })}
      aria-label={`${pick.name} vs ${enemy.name} の対策ノートを開く`}
      className="block rounded-full transition-colors duration-150 hover:ring-2 hover:ring-accent/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <BuildIcon
        src={pick.imagePath}
        label={pick.name}
        size={40}
        className="rounded-full"
      />
    </Link>
  );
}
