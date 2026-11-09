'use client';

import { useState } from 'react';
import { Tooltip } from '@/components/ui/tooltip';
import type { SkillInfo, SkillKey } from '@/lib/game-data';
import { SkillIconFace } from './SkillIconFace';
import { SkillTooltipContent } from './SkillTooltipContent';

interface SkillIconProps {
  /** スキルの情報。読み込み前・データが無いときは null */
  skill: SkillInfo | null;
  /** skill が null のときに出す文字 */
  fallbackKey: SkillKey;
  size?: number;
}

// スキル画像にツールチップを付ける。skill が null のときは文字だけ（ツールチップなし）
export function SkillIcon({ skill, fallbackKey, size = 32 }: SkillIconProps) {
  const [hasImageFailed, setHasImageFailed] = useState(false);
  const face = (
    <SkillIconFace
      skill={skill}
      fallbackKey={fallbackKey}
      size={size}
      hasImageFailed={hasImageFailed}
      onImageError={() => setHasImageFailed(true)}
    />
  );
  if (!skill) return face;
  return (
    <Tooltip trigger={face} content={<SkillTooltipContent skill={skill} />} />
  );
}
