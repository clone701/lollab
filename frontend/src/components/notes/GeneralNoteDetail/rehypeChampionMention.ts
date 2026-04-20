import { visit } from 'unist-util-visit';
import { champions } from '@/lib/data/champions';
import type { Root, Text, Element } from 'hast';

// チャンピオンIDを長い順にソート
const sortedIds = champions
  .map((c) => c.id)
  .sort((a, b) => b.length - a.length);

function findChampionId(
  text: string
): { id: string; name: string; imagePath: string } | null {
  const lower = text.toLowerCase();
  for (const id of sortedIds) {
    if (!lower.startsWith(id.toLowerCase())) continue;
    const next = text[id.length];
    if (next === undefined || !/[A-Za-z0-9]/.test(next)) {
      const champion = champions.find((c) => c.id === id)!;
      return { id, name: champion.name, imagePath: champion.imagePath };
    }
  }
  return null;
}

// テキストノード内の /championId をimg+span要素に変換するrehypeプラグイン
export function rehypeChampionMention() {
  return (tree: Root) => {
    visit(tree, 'text', (node: Text, index, parent) => {
      if (!parent || index === undefined) return;
      const parts = node.value.split('/');
      if (parts.length <= 1) return;

      const newNodes: (Text | Element)[] = [];
      parts.forEach((part, i) => {
        if (i === 0) {
          if (part) newNodes.push({ type: 'text', value: part });
          return;
        }
        const match = findChampionId(part);
        if (match) {
          const rest = part.slice(match.id.length);
          newNodes.push({
            type: 'element',
            tagName: 'span',
            properties: {},
            children: [
              {
                type: 'element',
                tagName: 'img',
                properties: {
                  src: match.imagePath,
                  alt: match.name,
                  width: 40,
                  height: 40,
                  title: match.name,
                  style:
                    'display:inline;border-radius:50%;vertical-align:middle;margin:0 2px',
                },
                children: [],
              },
              ...(rest ? [{ type: 'text', value: rest } as Text] : []),
            ],
          });
        } else {
          newNodes.push({ type: 'text', value: '/' + part });
        }
      });

      parent.children.splice(index, 1, ...newNodes);
    });
  };
}
