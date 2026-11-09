import type { DescriptionContainerType } from '@/lib/game-data';

/** 説明文のノードごとの見た目（色は役割の名前だけを使う） */
export const DESCRIPTION_STYLES: Record<DescriptionContainerType, string> = {
  stats: 'text-fg-muted',
  emphasis: 'font-semibold text-fg',
  heading: 'font-semibold text-highlight',
  aside: 'italic text-fg-subtle',
  physical: 'text-game-physical',
  magic: 'text-game-magic',
  trueDamage: 'font-semibold text-fg',
  heal: 'text-game-heal',
  shield: 'text-game-shield',
  status: 'text-game-status',
  mana: 'text-game-mana',
  keyword: 'font-semibold',
  term: 'text-game-keyword',
  number: 'font-semibold text-game-number',
  bold: 'font-semibold',
  gold: 'text-highlight',
};
