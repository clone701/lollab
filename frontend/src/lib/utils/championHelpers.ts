/**
 * チャンピオンヘルパー関数
 * 
 * チャンピオンデータの検索・取得機能を提供
 */

import { Champion } from '@/types/champion';
import { champions } from '@/lib/data/champions';

/**
 * チャンピオンIDからチャンピオン情報を取得
 * 
 * @param championId - チャンピオンID
 * @returns チャンピオン情報、見つからない場合はundefined
 */
export function getChampionById(championId: string): Champion | undefined {
    return champions.find(champion => champion.id === championId);
}
