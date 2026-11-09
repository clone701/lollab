'use client';

import { formatCooldown, toSpellInfo } from '@/lib/game-data';
import { TooltipBody } from './TooltipBody';
import { useSummonerData } from './useSummonerData';

interface SpellTooltipContentProps {
  /** 数値の ID（key）か、`SummonerFlash` のような文字の ID */
  id: number | string;
  /** 読み込み中・失敗・データが無いときに出す名前 */
  label: string;
  /** 見出しのアイコンの画像 */
  iconSrc: string | null;
}

// スペルは名前・クールダウン（秒）・説明
export function SpellTooltipContent({
  id,
  label,
  iconSrc,
}: SpellTooltipContentProps) {
  const state = useSummonerData(true);
  const info = state.status === 'data' ? toSpellInfo(state.data, id) : null;
  if (!info) return <TooltipBody title={label} iconSrc={iconSrc} />;
  return (
    <TooltipBody
      title={info.name}
      iconSrc={iconSrc}
      meta={formatCooldown(info.cooldownBurn)}
      description={info.description}
    />
  );
}
