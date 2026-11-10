import type { BuildElement } from '@/types/championBuild';
import { ItemIcons } from './ItemIcons';
import { NoData } from './NoData';
import { OptionStat } from './OptionStat';

interface LaterItemSlotProps {
  label: string;
  element: BuildElement;
}

// 4〜6番目のアイテム。試合数の多い上位3件を「OR」で並べる
export function LaterItemSlot({ label, element }: LaterItemSlotProps) {
  const options = element.options.slice(0, 3);
  return (
    <div className="flex flex-col gap-1">
      <h3 className="text-sm text-fg-muted">{label}</h3>
      {options.length === 0 ? (
        <NoData />
      ) : (
        <ul className="flex flex-wrap items-center gap-x-3 gap-y-2">
          {options.map((option, index) => (
            <li key={option.key.join('-')} className="flex items-center gap-3">
              {index > 0 && (
                <span className="text-xs font-semibold text-fg-subtle">OR</span>
              )}
              <div className="flex flex-col gap-0.5">
                <ItemIcons ids={option.key} />
                <OptionStat option={option} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
