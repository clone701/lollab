'use client';
import { useState } from 'react';
import { splitRuneKey, toRuneChoices } from '@/lib/champion-build';
import type { BuildElement } from '@/types/championBuild';
import { NoData } from './NoData';
import { OptionStat } from './OptionStat';
import { PanelSection } from './PanelSection';
import { RuneGroup } from './RuneGroup';
import { SegmentedControl } from './SegmentedControl';

interface RunePanelProps {
  runes: BuildElement;
}

// 上位2件を「1番目」「2番目」で切り替える。条件が変わったら呼び出し側の key で1番目に戻す
export function RunePanel({ runes }: RunePanelProps) {
  const [selected, setSelected] = useState('0');
  const choices = toRuneChoices(runes);
  const option = runes.options[Number(selected)] ?? runes.options[0] ?? null;
  const parts = option ? splitRuneKey(option.key) : null;
  return (
    <PanelSection title="ルーン">
      {choices.length > 1 && (
        <SegmentedControl
          label="ルーンの候補"
          value={selected}
          options={choices}
          onChange={setSelected}
        />
      )}
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
