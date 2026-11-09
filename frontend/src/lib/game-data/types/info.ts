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
  /** 数値入りの説明文。生成できていないスキルは null（概要の description を使う） */
  detail: string | null;
  /** パッシブは null */
  cooldownBurn: string | null;
  /** パッシブは null */
  costBurn: string | null;
  /** 射程。パッシブは null */
  rangeBurn: string | null;
  /** コストの種類（マナ・エネルギーなど） */
  partype: string;
  imagePath: string;
}
