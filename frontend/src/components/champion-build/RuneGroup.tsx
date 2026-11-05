import { getRuneIcon } from '@/lib/champion-build';
import { BuildIcon } from './BuildIcon';

interface RuneGroupProps {
  label: string;
  ids: number[];
}

export function RuneGroup({ label, ids }: RuneGroupProps) {
  return (
    <div className="flex items-center gap-3">
      <h3 className="w-16 shrink-0 text-sm text-gray-600">{label}</h3>
      <div className="flex gap-1">
        {ids.map((id, index) => {
          const icon = getRuneIcon(id);
          return (
            <BuildIcon
              key={`${id}-${index}`}
              src={icon?.src ?? null}
              label={icon?.name ?? `ルーン${id}`}
              size={36}
              className="rounded-full"
            />
          );
        })}
      </div>
    </div>
  );
}
