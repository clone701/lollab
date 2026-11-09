import { BuildIcon } from '@/components/ui/BuildIcon';
import { Tooltip } from '@/components/ui/tooltip';
import { ItemTooltipContent } from './ItemTooltipContent';
import type { TooltipIconProps } from './types';

// アイテムのアイコン。マウスを乗せると名前・価格・説明を出す
export function ItemTooltipIcon({ id, ...iconProps }: TooltipIconProps) {
  return (
    <Tooltip
      trigger={<BuildIcon {...iconProps} showTitle={false} />}
      content={
        <ItemTooltipContent
          id={id}
          label={iconProps.label}
          iconSrc={iconProps.src}
        />
      }
    />
  );
}
