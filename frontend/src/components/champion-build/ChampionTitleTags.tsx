import { toRoleLabel } from '@/lib/champion-info';

interface ChampionTitleTagsProps {
  /** 称号（例: ドレッドノート） */
  title: string;
  /** Data Dragon の tags（Fighter など） */
  tags: string[];
}

// チャンピオン名の横に出す称号と役割の札
export function ChampionTitleTags({ title, tags }: ChampionTitleTagsProps) {
  return (
    <>
      <span className="text-fg-muted">{title}</span>
      {tags.map((tag) => (
        <span
          key={tag}
          className="rounded-full border border-line-strong bg-surface-2 px-2 text-xs text-fg"
        >
          {toRoleLabel(tag)}
        </span>
      ))}
    </>
  );
}
