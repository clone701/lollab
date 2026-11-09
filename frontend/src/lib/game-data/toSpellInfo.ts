import { getOwn } from './getOwn';
import type { DdragonSummonerData, SpellInfo } from './types';

/**
 * サモナースペルの ID から画面用の情報を作る。無ければ null。
 * 数値の ID（`key`）と、`data` のキー（`SummonerFlash` など）のどちらでも引ける
 */
export function toSpellInfo(
  data: DdragonSummonerData,
  id: number | string
): SpellInfo | null {
  const key = String(id);
  const spell =
    getOwn(data.data, key) ??
    Object.values(data.data).find((s) => s.key === key);
  if (!spell) return null;
  return {
    name: spell.name,
    cooldownBurn: spell.cooldownBurn,
    description: spell.description,
  };
}
