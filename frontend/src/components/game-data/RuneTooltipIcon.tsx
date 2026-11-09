import { BuildIcon } from '@/components/ui/BuildIcon';
import { Tooltip } from '@/components/ui/tooltip';
import { RuneTooltipContent } from './RuneTooltipContent';
import type { TooltipIconProps } from './types';

// ルーン・パスのアイコン。マウスを乗せると名前と説明を出す
export function RuneTooltipIcon({ id, ...iconProps }: TooltipIconProps) {
  return (
    <Tooltip
      trigger={<BuildIcon {...iconProps} showTitle={false} />}
      content={
        <RuneTooltipContent
          id={id}
          label={iconProps.label}
          iconSrc={iconProps.src}
        />
      }
    />
  );
}
