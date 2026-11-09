import {
  highlightNumbers,
  highlightTerms,
  parseDescription,
} from '@/lib/game-data';
import { DescriptionNodeView } from './DescriptionNodeView';

interface DescriptionTextProps {
  /** Data Dragon の説明文（HTML 風の文字列） */
  html: string;
}

// 説明文を React の要素にして出す（dangerouslySetInnerHTML は使わない）。語と数値は色を付けて強調する（語を先に分け、語の中の数値は分けない）
export function DescriptionText({ html }: DescriptionTextProps) {
  return (
    <div className="leading-relaxed">
      {highlightNumbers(highlightTerms(parseDescription(html))).map(
        (node, i) => (
          <DescriptionNodeView key={i} node={node} />
        )
      )}
    </div>
  );
}
