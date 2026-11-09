'use client';

import { RuneTooltipContent } from '@/components/game-data';
import { Tooltip } from '@/components/ui/tooltip';
import { RuneButtonFace } from './RuneButtonFace';

interface RuneButtonProps {
  id: number;
  icon: string;
  name: string;
  selected: boolean;
  disabled: boolean;
  size?: 'sm' | 'md';
  ariaLabel: string;
  /** true のとき、マウスを乗せると名前と説明を出す（閲覧モード用） */
  tooltip?: boolean;
  onClick: () => void;
}

export function RuneButton({
  id,
  tooltip = false,
  size = 'md',
  ...faceProps
}: RuneButtonProps) {
  const face = (
    <RuneButtonFace {...faceProps} size={size} isWrapped={tooltip} />
  );
  if (!tooltip) return face;
  return (
    <Tooltip
      trigger={face}
      content={
        <RuneTooltipContent
          id={id}
          label={faceProps.name}
          iconSrc={faceProps.icon}
        />
      }
    />
  );
}
