import type { RuneIconTable } from './types';

/** ステータスシャード。パスは `/images/runes/StatMods/` からの相対 */
export const STAT_SHARDS: RuneIconTable = {
  5001: ['Health Scaling', 'StatModsHealthScalingIcon.png'],
  5011: ['Health', 'StatModsHealthPlusIcon.png'],
  5002: ['Armor', 'StatModsArmorIcon.png'],
  5003: ['Magic Resist', 'StatModsMagicResIcon.png'],
  5005: ['Attack Speed', 'StatModsAttackSpeedIcon.png'],
  5007: ['Ability Haste', 'StatModsCDRScalingIcon.png'],
  5008: ['Adaptive Force', 'StatModsAdaptiveForceIcon.png'],
  5010: ['Move Speed', 'StatModsMovementSpeedIcon.png'],
  5013: ['Tenacity', 'StatModsTenacityIcon.png'],
};
