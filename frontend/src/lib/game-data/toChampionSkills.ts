import type { DdragonChampionData, SkillInfo, SkillKey } from './types';

const SPELL_KEYS: SkillKey[] = ['Q', 'W', 'E', 'R'];

/** チャンピオン1体分の JSON から、パッシブと Q/W/E/R の順に SkillInfo を作る */
export function toChampionSkills(data: DdragonChampionData): SkillInfo[] {
  const champion = Object.values(data.data)[0];
  if (!champion) return [];
  const { passive, partype } = champion;
  const skills: SkillInfo[] = [
    {
      key: 'P',
      name: passive.name,
      description: passive.description,
      cooldownBurn: null,
      costBurn: null,
      partype,
      imagePath: `/images/img/passive/${passive.image.full}`,
    },
  ];
  SPELL_KEYS.forEach((key, i) => {
    const spell = champion.spells[i];
    if (!spell) return;
    skills.push({
      key,
      name: spell.name,
      description: spell.description,
      cooldownBurn: spell.cooldownBurn,
      costBurn: spell.costBurn,
      partype,
      imagePath: `/images/img/spell/${spell.image.full}`,
    });
  });
  return skills;
}
