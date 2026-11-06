// バックエンドの schemas/match_detail.py と同じ形（snake_case のまま扱う）

/** 参加者のランク（今わかっているもの。マスター以上は division が null） */
export interface RankBrief {
  tier: string;
  division: string | null;
}

/** 同じ分に購入したアイテム（購入順） */
export interface ItemPurchaseGroup {
  minute: number;
  item_ids: number[];
}

/** 参加者のビルド（タイムライン由来） */
export interface ParticipantBuild {
  item_purchases: ItemPurchaseGroup[];
  /** レベルごとに上げたスキル。1=Q, 2=W, 3=E, 4=R */
  skill_order: number[];
  /** 最大化の順（例: [1, 2, 3]） */
  skill_priority: number[];
}

/** 参加者1人分の成績とビルド */
export interface ParticipantDetail {
  puuid: string;
  riot_id_game_name: string | null;
  riot_id_tagline: string | null;
  team_id: number;
  team_position: string;
  champion_name: string;
  champ_level: number;
  /** [spell1, spell2] */
  spell_ids: number[];
  primary_style_id: number;
  sub_style_id: number;
  /** キーストーン含む4つ */
  primary_perk_ids: number[];
  sub_perk_ids: number[];
  /** offense, flex, defense */
  stat_perk_ids: number[];
  kills: number;
  deaths: number;
  assists: number;
  /** 0〜1 */
  kill_participation: number;
  damage_to_champions: number;
  damage_taken: number;
  wards_placed: number;
  wards_killed: number;
  cs: number;
  gold_earned: number;
  /** item0〜6（0 は空き） */
  item_ids: number[];
  rank: RankBrief | null;
  /** タイムラインがない場合は null */
  build: ParticipantBuild | null;
}
