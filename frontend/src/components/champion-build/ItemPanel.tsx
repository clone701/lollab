import type { BuildMode, ChampionBuildResponse } from '@/types/championBuild';
import { ItemSequence } from './ItemSequence';
import { LaterItemSlot } from './LaterItemSlot';
import { PanelSection } from './PanelSection';

interface ItemPanelProps {
  startingItems: ChampionBuildResponse['starting_items'];
  coreItems: ChampionBuildResponse['core_items'];
  item4: ChampionBuildResponse['item4'];
  item5: ChampionBuildResponse['item5'];
  item6: ChampionBuildResponse['item6'];
  mode: BuildMode;
}

export function ItemPanel({
  startingItems,
  coreItems,
  item4,
  item5,
  item6,
  mode,
}: ItemPanelProps) {
  return (
    <PanelSection title="アイテム">
      <ItemSequence
        label="開始アイテム"
        element={startingItems}
        mode={mode}
        separator="+"
      />
      <ItemSequence
        label="コアビルド"
        element={coreItems}
        mode={mode}
        separator="→"
      />
      <LaterItemSlot label="4番目" element={item4} />
      <LaterItemSlot label="5番目" element={item5} />
      <LaterItemSlot label="6番目" element={item6} />
    </PanelSection>
  );
}
