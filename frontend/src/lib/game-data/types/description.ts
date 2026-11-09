// 説明文のノード

export type DescriptionContainerType =
  | 'stats'
  | 'emphasis'
  | 'heading'
  | 'aside'
  | 'physical'
  | 'magic'
  | 'trueDamage'
  | 'heal'
  | 'shield'
  | 'status'
  | 'mana'
  | 'keyword'
  | 'term'
  | 'number'
  | 'bold'
  | 'gold';

export type DescriptionNode =
  | { type: 'text'; text: string }
  | { type: 'lineBreak' }
  | { type: DescriptionContainerType; children: DescriptionNode[] };
