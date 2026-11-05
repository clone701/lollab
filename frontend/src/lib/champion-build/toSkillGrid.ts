import { SKILL_LABELS, SKILL_ORDER_LEVELS } from './constants';

/** スキル順を「行: Q/W/E/R × 列: レベル1〜15」の真偽値マス目にする */
export function toSkillGrid(key: number[]): boolean[][] {
  return SKILL_LABELS.map((_, row) =>
    Array.from(
      { length: SKILL_ORDER_LEVELS },
      (_unused, col) => key[col] === row + 1
    )
  );
}
