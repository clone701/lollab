import type { DescriptionContainerType, DescriptionNode } from './types';

type TermType = Extract<
  DescriptionContainerType,
  'status' | 'physical' | 'magic' | 'trueDamage' | 'shield' | 'heal'
>;

/** 語と役割の一覧。長い語を先に当てるため、前にあるものほど優先する */
const TERM_RULES: ReadonlyArray<readonly [TermType, string]> = [
  ['trueDamage', '確定ダメージ'],
  ['physical', '物理ダメージ'],
  ['magic', '魔法ダメージ'],
  ['heal', '体力を回復'],
  ['shield', 'シールド'],
  ['heal', '回復'],
  [
    'status',
    '(?:スロウ|スタン|ノックアップ|ノックバック|スネア|フィアー|移動不能|サプレッション|行動妨害|サイレンス|チャーム|釘付け|バーサーク|タウント|眠り|打ち上げ|引き寄せ|重傷)(?:効果|状態)?',
  ],
];

/** 各語のグループを順に並べた正規表現（グループの番号が TERM_RULES の順） */
const TERM_PATTERN = new RegExp(
  TERM_RULES.map(([, word]) => `(${word})`).join('|'),
  'g'
);

/** 文字を、決まった語のノードとそれ以外の文字のノードに分ける */
export function splitTerms(text: string): DescriptionNode[] {
  const nodes: DescriptionNode[] = [];
  let last = 0;
  for (const match of text.matchAll(TERM_PATTERN)) {
    const index = match.index ?? 0;
    const groupIndex = match.slice(1).findIndex((g) => g !== undefined);
    if (index > last)
      nodes.push({ type: 'text', text: text.slice(last, index) });
    nodes.push({
      type: TERM_RULES[groupIndex][0],
      children: [{ type: 'text', text: match[0] }],
    });
    last = index + match[0].length;
  }
  if (last < text.length) nodes.push({ type: 'text', text: text.slice(last) });
  return nodes;
}
