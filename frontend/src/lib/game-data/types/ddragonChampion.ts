// Data Dragon の champion/*.json の型（使う項目だけ）

interface DdragonImage {
  full: string;
}

export interface DdragonPassive {
  name: string;
  description: string;
  image: DdragonImage;
}

export interface DdragonChampionSpell {
  name: string;
  description: string;
  cooldownBurn: string;
  costBurn: string;
  rangeBurn: string;
  image: DdragonImage;
}

export interface DdragonChampionInfo {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
}

export interface DdragonChampionStats {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeed: number;
  attackspeedperlevel: number;
}

export interface DdragonChampion {
  /** 称号（例: ドレッドノート） */
  title: string;
  /** 役割（Fighter・Tank など） */
  tags: string[];
  partype: string;
  info: DdragonChampionInfo;
  stats: DdragonChampionStats;
  passive: DdragonPassive;
  spells: DdragonChampionSpell[];
}

export interface DdragonChampionData {
  data: Record<string, DdragonChampion>;
}
