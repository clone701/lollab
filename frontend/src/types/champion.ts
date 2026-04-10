/**
 * Champion型定義
 * 
 * チャンピオンの基本情報を表す型
 * 要件: 11.1, 11.2, 11.4
 */
export interface Champion {
    /** チャンピオンID（例: "Ahri", "Zed"） */
    id: string;

    /** 表示名（例: "アーリ", "ゼド"） */
    name: string;

    /** 画像パス（例: "/images/champion/Ahri.png"） */
    imagePath: string;
}
