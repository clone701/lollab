import type { Champion } from '@/types/champion';
import { BuildIcon } from '@/components/champion-build';

// 行の左側に出す相手チャンピオンのアイコンと名前
export function EnemyLabel({ enemy }: { enemy: Champion }) {
  return (
    <div className="flex w-40 shrink-0 items-center gap-2">
      <BuildIcon
        src={enemy.imagePath}
        label={enemy.name}
        size={32}
        className="rounded-full"
      />
      <span className="truncate text-sm text-fg">{enemy.name}</span>
    </div>
  );
}
