import type { DescriptionNode } from '@/lib/game-data';
import { DESCRIPTION_STYLES } from './descriptionStyles';

interface DescriptionNodeViewProps {
  node: DescriptionNode;
}

// 文字は React の文字列として出す（エスケープは React に任せる）
export function DescriptionNodeView({ node }: DescriptionNodeViewProps) {
  if (node.type === 'text') return <>{node.text}</>;
  if (node.type === 'lineBreak') return <br />;
  return (
    <span className={DESCRIPTION_STYLES[node.type]}>
      {node.children.map((child, i) => (
        <DescriptionNodeView key={i} node={child} />
      ))}
    </span>
  );
}
