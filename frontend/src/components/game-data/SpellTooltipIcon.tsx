import { BuildIcon } from '@/components/ui/BuildIcon';
import { Tooltip } from '@/components/ui/tooltip';
import { SpellTooltipContent } from './SpellTooltipContent';
import type { TooltipIconProps } from './types';

// サモナースペルのアイコン。マウスを乗せると名前・クールダウン・説明を出す
export function SpellTooltipIcon({ id, ...iconProps }: TooltipIconProps) {
  return (
    <Tooltip
      trigger={<BuildIcon {...iconProps} showTitle={false} />}
      content={
        <SpellTooltipContent
          id={id}
          label={iconProps.label}
          iconSrc={iconProps.src}
        />
      }
    />
  );
}
