// Data Dragon の summoner.json の型（使う項目だけ）

export interface DdragonSummoner {
  /** 数値の ID（文字列） */
  key: string;
  name: string;
  description: string;
  cooldownBurn: string;
}

export interface DdragonSummonerData {
  data: Record<string, DdragonSummoner>;
}
