// 生成した数値入りの説明文（public/data/skills/<Key>.json）の型

export interface SkillValues {
  version: string;
  /** 解けなかったときは null */
  passive: string | null;
  /** Q/W/E/R の順。解けなかったスキルは null */
  spells: (string | null)[];
}
