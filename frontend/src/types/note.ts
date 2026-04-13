// チャンピオンノート型定義

/**
 * チャンピオン対策ノート
 */
export interface ChampionNote {
    id: number;
    user_id: string;
    my_champion_id: string;
    enemy_champion_id: string;
    preset_name: string;
    runes: RuneConfig | null;
    spells: string[] | null;
    items: string[] | null;
    memo: string | null;
    created_at: string;
    updated_at: string;
}

/**
 * ルーン構成
 */
export interface RuneConfig {
    primaryPath: number;
    secondaryPath: number;
    keystone: number;
    primaryRunes: number[];  // 3つ
    secondaryRunes: number[]; // 2つ
    shards: number[];         // 3つ
}

/**
 * ルーンパス（メイン・サブ）
 */
export interface RunePath {
    id: number;
    name: string;
    icon: string;
}

/**
 * ルーン
 */
export interface Rune {
    id: number;
    name: string;
    icon: string;
}

/**
 * サモナースペル
 */
export interface SummonerSpell {
    id: string;
    name: string;
    icon: string;
}

/**
 * アイテム
 */
export interface Item {
    id: string;
    name: string;
    icon: string;
}
