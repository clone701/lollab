import { RIOT_CHAMPION_NAMES } from '@/lib/champion-build';

/** Riot の championName → 画面の ID（champions.ts の id）。RIOT_CHAMPION_NAMES の逆引き */
const IDS_BY_RIOT_NAME: Record<string, string> = Object.fromEntries(
  Object.entries(RIOT_CHAMPION_NAMES).map(([id, riotName]) => [riotName, id])
);

/** 試合の championName から、画像・ビルドページの URL に使う ID にする */
export function toChampionId(riotName: string): string {
  return IDS_BY_RIOT_NAME[riotName] ?? riotName;
}
