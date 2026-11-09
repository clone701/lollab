import type {
  DdragonChampionData,
  SkillInfo,
  SkillKey,
  SkillValues,
} from './types';

const SPELL_KEYS: SkillKey[] = ['Q', 'W', 'E', 'R'];

/**
 * チャンピオン1体分の JSON から、パッシブと Q/W/E/R の順に SkillInfo を作る。
 * skillValues があれば、数値入りの説明文を detail に入れる
 */
export function toChampionSkills(
  data: DdragonChampionData,
  skillValues: SkillValues | null = null
): SkillInfo[] {
  const champion = Object.values(data.data)[0];
  if (!champion) return [];
  const { passive, partype } = champion;
  const skills: SkillInfo[] = [
    {
      key: 'P',
      name: passive.name,
      description: passive.description,
      detail: skillValues?.passive ?? null,
      cooldownBurn: null,
      costBurn: null,
      rangeBurn: null,
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
      detail: skillValues?.spells[i] ?? null,
      cooldownBurn: spell.cooldownBurn,
      costBurn: spell.costBurn,
      rangeBurn: spell.rangeBurn,
      partype,
      imagePath: `/images/img/spell/${spell.image.full}`,
    });
  });
  return skills;
}
