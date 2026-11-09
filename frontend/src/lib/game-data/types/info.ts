// 画面用の情報

export interface ItemInfo {
  name: string;
  totalGold: number;
  description: string;
}

export interface RuneInfo {
  name: string;
  /** パスのときは無い */
  description?: string;
}

export interface SpellInfo {
  name: string;
  cooldownBurn: string;
  description: string;
}

export type SkillKey = 'P' | 'Q' | 'W' | 'E' | 'R';

export interface SkillInfo {
  key: SkillKey;
  name: string;
  description: string;
  /** パッシブは null */
  cooldownBurn: string | null;
  /** パッシブは null */
  costBurn: string | null;
  /** コストの種類（マナ・エネルギーなど） */
  partype: string;
  imagePath: string;
}
