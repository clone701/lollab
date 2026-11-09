import { BuildIcon } from '@/components/ui/BuildIcon';
import { DescriptionText } from './DescriptionText';

interface TooltipBodyProps {
  title: string;
  /** 見出しの左に出すアイコンの画像。無ければアイコンなし */
  iconSrc?: string | null;
  /** 名前の右上に出す価格・クールダウン */
  meta?: string;
  /** meta の下に出す補足（コスト・メッセージ）。meta が無いときは名前の下 */
  subline?: string;
  /** 説明文（HTML 風の文字列）。枠線で区切って出す */
  description?: string;
}

// ツールチップの中身の共通の並び: アイコン、名前と価格・CD、補足、区切り線、説明
export function TooltipBody({
  title,
  iconSrc,
  meta,
  subline,
  description,
}: TooltipBodyProps) {
  const sublineView = subline && (
    <div className="text-xs text-fg-muted">{subline}</div>
  );
  return (
    <div>
      <div className="flex items-start gap-3">
        {iconSrc && (
          <span className="shrink-0">
            <BuildIcon
              src={iconSrc}
              label={title}
              size={40}
              showTitle={false}
            />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <span className="text-base font-semibold text-highlight">
            {title}
          </span>
          {!meta && sublineView}
        </div>
        {meta && (
          <div className="shrink-0 text-right">
            <div className="whitespace-nowrap font-semibold">{meta}</div>
            {sublineView}
          </div>
        )}
      </div>
      {description && (
        <div className="mt-2 border-t border-line pt-2 leading-relaxed">
          <DescriptionText html={description} />
        </div>
      )}
    </div>
  );
}
