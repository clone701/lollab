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
  image: DdragonImage;
}

export interface DdragonChampion {
  partype: string;
  passive: DdragonPassive;
  spells: DdragonChampionSpell[];
}

export interface DdragonChampionData {
  data: Record<string, DdragonChampion>;
}
