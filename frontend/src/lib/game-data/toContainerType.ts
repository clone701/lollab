import type { DescriptionContainerType } from './types';

/** タグ名（小文字）から、入れ子のノードの種類を決める。知らないタグは null */
export function toContainerType(
  tagName: string
): DescriptionContainerType | null {
  switch (tagName) {
    case 'stats':
      return 'stats';
    case 'attention':
      return 'emphasis';
    case 'active':
    case 'passive':
    case 'keywordmajor':
      return 'heading';
    case 'rules':
    case 'flavortext':
      return 'aside';
    case 'physicaldamage':
    case 'scalead':
      return 'physical';
    case 'magicdamage':
    case 'scaleap':
      return 'magic';
    case 'truedamage':
      return 'trueDamage';
    case 'healing':
    case 'scalehealth':
    case 'lifesteal':
      return 'heal';
    case 'shield':
      return 'shield';
    case 'status':
      return 'status';
    case 'scalemana':
      return 'mana';
    case 'keyword':
    case 'keywordname':
    case 'keywordstealth':
    case 'spellname':
      return 'keyword';
    case 'lol-uikit-tooltipped-keyword':
      return 'term';
    case 'b':
      return 'bold';
    case 'gold':
      return 'gold';
    default:
      return null;
  }
}
