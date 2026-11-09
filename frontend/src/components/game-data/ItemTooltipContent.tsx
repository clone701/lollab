'use client';

import { toItemInfo } from '@/lib/game-data';
import { formatGold } from './formatGold';
import { TooltipBody } from './TooltipBody';
import { useItemData } from './useItemData';

interface ItemTooltipContentProps {
  id: number;
  /** 読み込み中・失敗のときに出す名前 */
  label: string;
  /** 見出しのアイコンの画像 */
  iconSrc: string | null;
}

// 読み込み中・失敗は label だけ。Data Dragon に無い ID は「情報がありません」
export function ItemTooltipContent({
  id,
  label,
  iconSrc,
}: ItemTooltipContentProps) {
  const state = useItemData(true);
  if (state.status !== 'data') {
    return <TooltipBody title={label} iconSrc={iconSrc} />;
  }

  const info = toItemInfo(state.data, id);
  if (!info) {
    return (
      <TooltipBody title={label} iconSrc={iconSrc} subline="情報がありません" />
    );
  }
  return (
    <TooltipBody
      title={info.name}
      iconSrc={iconSrc}
      meta={formatGold(info.totalGold)}
      description={info.description}
    />
  );
}
