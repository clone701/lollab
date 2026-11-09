'use client';

import { toRuneInfo } from '@/lib/game-data';
import { TooltipBody } from './TooltipBody';
import { useRuneData } from './useRuneData';

interface RuneTooltipContentProps {
  id: number;
  /** 読み込み中・失敗・データが無い（ステータスシャードなど）ときに出す名前 */
  label: string;
  /** 見出しのアイコンの画像 */
  iconSrc: string | null;
}

// ルーンは名前と説明。パスは名前だけ
export function RuneTooltipContent({
  id,
  label,
  iconSrc,
}: RuneTooltipContentProps) {
  const state = useRuneData(true);
  const info = state.status === 'data' ? toRuneInfo(state.data, id) : null;
  if (!info) return <TooltipBody title={label} iconSrc={iconSrc} />;
  return (
    <TooltipBody
      title={info.name}
      iconSrc={iconSrc}
      description={info.description}
    />
  );
}
