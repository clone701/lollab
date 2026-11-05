import { selectOption } from '@/lib/champion-build';
import type { BuildElement, BuildMode } from '@/types/championBuild';
import { ItemIcons } from './ItemIcons';
import { NoData } from './NoData';
import { OptionStat } from './OptionStat';

interface ItemSequenceProps {
  label: string;
  element: BuildElement;
  mode: BuildMode;
  separator?: string;
}

// 開始アイテム・コアビルドのように、1つの選択肢が複数アイテムの並びになる要素
export function ItemSequence({
  label,
  element,
  mode,
  separator,
}: ItemSequenceProps) {
  const option = selectOption(element, mode);
  return (
    <div className="flex flex-col gap-1">
      <h3 className="text-sm text-fg-muted">{label}</h3>
      {option ? (
        <div className="flex flex-wrap items-center gap-3">
          <ItemIcons ids={option.key} separator={separator} />
          <OptionStat option={option} />
        </div>
      ) : (
        <NoData />
      )}
    </div>
  );
}
