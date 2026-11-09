import Image from 'next/image';
import type { SkillInfo, SkillKey } from '@/lib/game-data';

interface SkillIconFaceProps {
  /** スキルの情報。null や画像が読み込めないときは文字だけを出す */
  skill: SkillInfo | null;
  fallbackKey: SkillKey;
  size: number;
  /** 画像の読み込みに失敗したか */
  hasImageFailed: boolean;
  onImageError: () => void;
}

// スキル画像の右下に Q/W/E/R を重ねる。画像が無いときは枠に文字だけを出す
export function SkillIconFace({
  skill,
  fallbackKey,
  size,
  hasImageFailed,
  onImageError,
}: SkillIconFaceProps) {
  const key = skill?.key ?? fallbackKey;
  if (!skill || hasImageFailed) {
    return (
      <span
        style={{ width: size, height: size }}
        className="inline-flex items-center justify-center rounded bg-surface-2 text-xs font-semibold text-fg-muted"
      >
        {key}
      </span>
    );
  }
  return (
    <span className="relative inline-flex">
      <Image
        src={skill.imagePath}
        alt={skill.name}
        width={size}
        height={size}
        unoptimized
        className="rounded"
        onError={onImageError}
      />
      <span className="absolute bottom-0 right-0 rounded-tl bg-black/60 px-0.5 text-xs font-semibold leading-none text-fg">
        {key}
      </span>
    </span>
  );
}
