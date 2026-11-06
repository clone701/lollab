export const TIER_LABELS: Record<string, string> = {
  IRON: 'アイアン',
  BRONZE: 'ブロンズ',
  SILVER: 'シルバー',
  GOLD: 'ゴールド',
  PLATINUM: 'プラチナ',
  EMERALD: 'エメラルド',
  DIAMOND: 'ダイヤモンド',
  MASTER: 'マスター',
  GRANDMASTER: 'グランドマスター',
  CHALLENGER: 'チャレンジャー',
};

/** ディビジョンを持たないティア（保存値に I が入っていても表示しない） */
export const TIERS_WITHOUT_DIVISION = ['MASTER', 'GRANDMASTER', 'CHALLENGER'];

export const DIVISION_NUMBERS: Record<string, string> = {
  I: '1',
  II: '2',
  III: '3',
  IV: '4',
};
