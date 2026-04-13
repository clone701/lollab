export type SummonerSpell = {
  id: string;
  name: string;
  icon: string;
};

export const SUMMONER_SPELLS: SummonerSpell[] = [
  { id: 'SummonerFlash',  name: 'Flash',  icon: `/images/summonerSpells/SummonerFlash.png` },
  { id: 'SummonerIgnite', name: 'Ignite', icon: `/images/summonerSpells/SummonerDot.png` },
  { id: 'SummonerTeleport', name: 'Teleport', icon: `/images/summonerSpells/SummonerTeleport.png` },
  { id: 'SummonerBarrier', name: 'Barrier', icon: `/images/summonerSpells/SummonerBarrier.png` },
  { id: 'SummonerHeal', name: 'Heal', icon: `/images/summonerSpells/SummonerHeal.png` },
  { id: 'SummonerBoost', name: 'Cleanse', icon: `/images/summonerSpells/SummonerBoost.png` },
  { id: 'SummonerExhaust', name: 'Exhaust', icon: `/images/summonerSpells/SummonerExhaust.png` },
  { id: 'SummonerHaste', name: 'Ghost', icon: `/images/summonerSpells/SummonerHaste.png` },
];