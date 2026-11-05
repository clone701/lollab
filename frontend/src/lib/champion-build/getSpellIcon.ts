export interface SpellIcon {
  name: string;
  src: string;
}

/** サモナースペル ID → [表示名, 画像ファイル名]。画像は /images/summonerSpells/ */
const SPELLS: Record<number, [string, string]> = {
  1: ['Cleanse', 'SummonerBoost'],
  3: ['Exhaust', 'SummonerExhaust'],
  4: ['Flash', 'SummonerFlash'],
  6: ['Ghost', 'SummonerHaste'],
  7: ['Heal', 'SummonerHeal'],
  11: ['Smite', 'SummonerSmite'],
  12: ['Teleport', 'SummonerTeleport'],
  14: ['Ignite', 'SummonerDot'],
  21: ['Barrier', 'SummonerBarrier'],
};

/** スペル ID から表示名と画像を引く。未知の ID は null */
export function getSpellIcon(id: number): SpellIcon | null {
  const entry = SPELLS[id];
  if (!entry) return null;
  return { name: entry[0], src: `/images/summonerSpells/${entry[1]}.png` };
}
