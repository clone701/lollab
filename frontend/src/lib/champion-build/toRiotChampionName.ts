import { RIOT_CHAMPION_NAMES } from './constants';

/** 画面の ID（champions.ts の id）を、API が受け取る Riot の championName にする */
export function toRiotChampionName(championId: string): string {
  return RIOT_CHAMPION_NAMES[championId] ?? championId;
}
