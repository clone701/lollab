import { selectOption, splitRuneKey } from '@/lib/champion-build';
import type { BuildElement, BuildMode } from '@/types/championBuild';
import { NoData } from './NoData';
import { OptionStat } from './OptionStat';
import { PanelSection } from './PanelSection';
import { RuneGroup } from './RuneGroup';

interface RunePanelProps {
  runes: BuildElement;
  mode: BuildMode;
}

export function RunePanel({ runes, mode }: RunePanelProps) {
  const option = selectOption(runes, mode);
  const parts = option ? splitRuneKey(option.key) : null;
  return (
    <PanelSection title="ルーン">
      {option && parts ? (
        <>
          <RuneGroup
            label="メイン"
            ids={[parts.primaryStyle, ...parts.primary]}
          />
          <RuneGroup label="サブ" ids={[parts.subStyle, ...parts.sub]} />
          <RuneGroup label="シャード" ids={parts.shards} />
          <OptionStat option={option} />
        </>
      ) : (
        <NoData />
      )}
    </PanelSection>
  );
}
