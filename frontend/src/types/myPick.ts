/** マイピックのレーン（値は試合データの team_position と同じ） */
export type PickLane = 'TOP' | 'JUNGLE' | 'MIDDLE' | 'BOTTOM' | 'UTILITY';

/** マイピック表（一覧用） */
export interface PickSheet {
  id: number;
  /** 表の名前（1〜50文字） */
  name: string;
  lane: PickLane;
  /** ピックが1つ以上ある相手チャンピオンの数 */
  entryCount: number;
  createdAt: string;
  updatedAt: string;
}

/** 相手チャンピオン1体分のピック */
export interface PickRow {
  /** 相手チャンピオンの id（champions.ts。例: Ahri） */
  enemyChampionId: string;
  /** 自分のピック。順番どおり、最大10、重複なし */
  pickChampionIds: string[];
}

/** 表とそのピック */
export interface PickSheetDetail extends PickSheet {
  /** ピックが1つ以上ある行だけ */
  rows: PickRow[];
}
