// ルーンデータ定義
// League of Legendsのルーンシステムのデータを定義

export interface RunePath {
  id: number;
  name: string;
  icon: string;
}

export interface Rune {
  id: number;
  name: string;
  icon: string;
}

// ルーンパス（5つ）
export const RUNE_PATHS: RunePath[] = [
  {
    id: 8000,
    name: 'Precision',
    icon: '/images/runes/Styles/7201_Precision.png',
  },
  {
    id: 8100,
    name: 'Domination',
    icon: '/images/runes/Styles/7200_Domination.png',
  },
  {
    id: 8200,
    name: 'Sorcery',
    icon: '/images/runes/Styles/7202_Sorcery.png',
  },
  {
    id: 8300,
    name: 'Resolve',
    icon: '/images/runes/Styles/7204_Resolve.png',
  },
  {
    id: 8400,
    name: 'Inspiration',
    icon: '/images/runes/Styles/7203_Whimsy.png',
  },
];

// キーストーンルーン（各パスに3-4個）
export const KEYSTONES: Record<number, Rune[]> = {
  8000: [
    // Precision
    {
      id: 8005,
      name: 'Press the Attack',
      icon: '/images/runes/Styles/Precision/PressTheAttack/PressTheAttack.png',
    },
    {
      id: 8008,
      name: 'Lethal Tempo',
      icon: '/images/runes/Styles/Precision/LethalTempo/LethalTempoTemp.png',
    },
    {
      id: 8021,
      name: 'Fleet Footwork',
      icon: '/images/runes/Styles/Precision/FleetFootwork/FleetFootwork.png',
    },
    {
      id: 8010,
      name: 'Conqueror',
      icon: '/images/runes/Styles/Precision/Conqueror/Conqueror.png',
    },
  ],
  8100: [
    // Domination
    {
      id: 8112,
      name: 'Electrocute',
      icon: '/images/runes/Styles/Domination/Electrocute/Electrocute.png',
    },
    {
      id: 8124,
      name: 'Dark Harvest',
      icon: '/images/runes/Styles/Domination/DarkHarvest/DarkHarvest.png',
    },
    {
      id: 8128,
      name: 'Hail of Blades',
      icon: '/images/runes/Styles/Domination/HailOfBlades/HailOfBlades.png',
    },
  ],
  8200: [
    // Sorcery
    {
      id: 8214,
      name: 'Summon Aery',
      icon: '/images/runes/Styles/Sorcery/SummonAery/SummonAery.png',
    },
    {
      id: 8229,
      name: 'Arcane Comet',
      icon: '/images/runes/Styles/Sorcery/ArcaneComet/ArcaneComet.png',
    },
    {
      id: 8230,
      name: 'Phase Rush',
      icon: '/images/runes/Styles/Sorcery/PhaseRush/PhaseRush.png',
    },
  ],
  8300: [
    // Resolve
    {
      id: 8437,
      name: 'Grasp of the Undying',
      icon: '/images/runes/Styles/Resolve/GraspOfTheUndying/GraspOfTheUndying.png',
    },
    {
      id: 8439,
      name: 'Veteran Aftershock',
      icon: '/images/runes/Styles/Resolve/VeteranAftershock/VeteranAftershock.png',
    },
    {
      id: 8465,
      name: 'Guardian',
      icon: '/images/runes/Styles/Resolve/Guardian/Guardian.png',
    },
  ],
  8400: [
    // Inspiration
    {
      id: 8351,
      name: 'Glacial Augment',
      icon: '/images/runes/Styles/Inspiration/GlacialAugment/GlacialAugment.png',
    },
    {
      id: 8360,
      name: 'Unsealed Spellbook',
      icon: '/images/runes/Styles/Inspiration/UnsealedSpellbook/UnsealedSpellbook.png',
    },
    {
      id: 8369,
      name: 'First Strike',
      icon: '/images/runes/Styles/Inspiration/FirstStrike/FirstStrike.png',
    },
  ],
};

// メインルーン（各パス、各段階に3個）
export const PRIMARY_RUNES: Record<number, Record<number, Rune[]>> = {
  8000: {
    // Precision
    0: [
      {
        id: 9101,
        name: 'Absorb Life',
        icon: '/images/runes/Styles/Precision/AbsorbLife/AbsorbLife.png',
      },
      {
        id: 9111,
        name: 'Triumph',
        icon: '/images/runes/Styles/Precision/Triumph.png',
      },
      {
        id: 8009,
        name: 'Presence of Mind',
        icon: '/images/runes/Styles/Precision/PresenceOfMind/PresenceOfMind.png',
      },
    ],
    1: [
      {
        id: 9104,
        name: 'Legend: Alacrity',
        icon: '/images/runes/Styles/Precision/LegendAlacrity/LegendAlacrity.png',
      },
      {
        id: 9105,
        name: 'Legend: Haste',
        icon: '/images/runes/Styles/Precision/LegendHaste/LegendHaste.png',
      },
      {
        id: 9103,
        name: 'Legend: Bloodline',
        icon: '/images/runes/Styles/Precision/LegendBloodline/LegendBloodline.png',
      },
    ],
    2: [
      {
        id: 8014,
        name: 'Coup de Grace',
        icon: '/images/runes/Styles/Precision/CoupDeGrace/CoupDeGrace.png',
      },
      {
        id: 8017,
        name: 'Cut Down',
        icon: '/images/runes/Styles/Precision/CutDown/CutDown.png',
      },
      {
        id: 8299,
        name: 'Last Stand',
        icon: '/images/runes/Styles/Precision/LastStand/LastStand.png',
      },
    ],
  },
  8100: {
    // Domination
    0: [
      {
        id: 8126,
        name: 'Cheap Shot',
        icon: '/images/runes/Styles/Domination/CheapShot/CheapShot.png',
      },
      {
        id: 8139,
        name: 'Taste of Blood',
        icon: '/images/runes/Styles/Domination/TasteOfBlood/GreenTerror_TasteOfBlood.png',
      },
      {
        id: 8143,
        name: 'Sudden Impact',
        icon: '/images/runes/Styles/Domination/SuddenImpact/SuddenImpact.png',
      },
    ],
    1: [
      {
        id: 8136,
        name: 'Sixth Sense',
        icon: '/images/runes/Styles/Domination/SixthSense/SixthSense.png',
      },
      {
        id: 8120,
        name: 'Grisly Mementos',
        icon: '/images/runes/Styles/Domination/GhostPoro/GhostPoro.png',
      },
      {
        id: 8138,
        name: 'Deep Ward',
        icon: '/images/runes/Styles/Domination/EyeballCollection/EyeballCollection.png',
      },
    ],
    2: [
      {
        id: 8135,
        name: 'Treasure Hunter',
        icon: '/images/runes/Styles/Domination/TreasureHunter/TreasureHunter.png',
      },
      {
        id: 8134,
        name: 'Ultimate Hunter',
        icon: '/images/runes/Styles/Domination/UltimateHunter/UltimateHunter.png',
      },
      {
        id: 8105,
        name: 'Relentless Hunter',
        icon: '/images/runes/Styles/Domination/RelentlessHunter/RelentlessHunter.png',
      },
    ],
  },
  8200: {
    // Sorcery
    0: [
      {
        id: 8224,
        name: 'Nullifying Orb',
        icon: '/images/runes/Styles/Sorcery/NullifyingOrb/Pokeshield.png',
      },
      {
        id: 8226,
        name: 'Manaflow Band',
        icon: '/images/runes/Styles/Sorcery/ManaflowBand/ManaflowBand.png',
      },
      {
        id: 8275,
        name: 'Axiom Arcanist',
        icon: '/images/runes/Styles/Sorcery/NimbusCloak/6361.png',
      },
    ],
    1: [
      {
        id: 8210,
        name: 'Transcendence',
        icon: '/images/runes/Styles/Sorcery/Transcendence/Transcendence.png',
      },
      {
        id: 8234,
        name: 'Celerity',
        icon: '/images/runes/Styles/Sorcery/Celerity/CelerityTemp.png',
      },
      {
        id: 8233,
        name: 'Absolute Focus',
        icon: '/images/runes/Styles/Sorcery/AbsoluteFocus/AbsoluteFocus.png',
      },
    ],
    2: [
      {
        id: 8237,
        name: 'Scorch',
        icon: '/images/runes/Styles/Sorcery/Scorch/Scorch.png',
      },
      {
        id: 8232,
        name: 'Waterwalking',
        icon: '/images/runes/Styles/Sorcery/Waterwalking/Waterwalking.png',
      },
      {
        id: 8236,
        name: 'Gathering Storm',
        icon: '/images/runes/Styles/Sorcery/GatheringStorm/GatheringStorm.png',
      },
    ],
  },
  8300: {
    // Resolve
    0: [
      {
        id: 8446,
        name: 'Demolish',
        icon: '/images/runes/Styles/Resolve/Demolish/Demolish.png',
      },
      {
        id: 8463,
        name: 'Font of Life',
        icon: '/images/runes/Styles/Resolve/FontOfLife/FontOfLife.png',
      },
      {
        id: 8401,
        name: 'Mirror Shell',
        icon: '/images/runes/Styles/Resolve/MirrorShell/MirrorShell.png',
      },
    ],
    1: [
      {
        id: 8429,
        name: 'Conditioning',
        icon: '/images/runes/Styles/Resolve/Conditioning/Conditioning.png',
      },
      {
        id: 8444,
        name: 'Second Wind',
        icon: '/images/runes/Styles/Resolve/SecondWind/SecondWind.png',
      },
      {
        id: 8473,
        name: 'Bone Plating',
        icon: '/images/runes/Styles/Resolve/BonePlating/BonePlating.png',
      },
    ],
    2: [
      {
        id: 8451,
        name: 'Overgrowth',
        icon: '/images/runes/Styles/Resolve/Overgrowth/Overgrowth.png',
      },
      {
        id: 8453,
        name: 'Revitalize',
        icon: '/images/runes/Styles/Resolve/Revitalize/Revitalize.png',
      },
      {
        id: 8242,
        name: 'Unflinching',
        icon: '/images/runes/Styles/Resolve/Unflinching/Unflinching.png',
      },
    ],
  },
  8400: {
    // Inspiration
    0: [
      {
        id: 8306,
        name: 'Hextech Flashtraption',
        icon: '/images/runes/Styles/Inspiration/HextechFlashtraption/HextechFlashtraption.png',
      },
      {
        id: 8304,
        name: 'Magical Footwear',
        icon: '/images/runes/Styles/Inspiration/MagicalFootwear/MagicalFootwear.png',
      },
      {
        id: 8321,
        name: 'Cash Back',
        icon: '/images/runes/Styles/Inspiration/CashBack/CashBack.png',
      },
    ],
    1: [
      {
        id: 8313,
        name: 'Time Warp Tonic',
        icon: '/images/runes/Styles/Inspiration/TimeWarpTonic/TimeWarpTonic.png',
      },
      {
        id: 8352,
        name: 'Jack of All Trades',
        icon: '/images/runes/Styles/Inspiration/JackOfAllTrades/JackOfAllTrades.png',
      },
      {
        id: 8345,
        name: 'Triple Tonic',
        icon: '/images/runes/Styles/Inspiration/PerfectTiming/PerfectTiming.png',
      },
    ],
    2: [
      {
        id: 8410,
        name: 'Approach Velocity',
        icon: '/images/runes/Styles/Inspiration/ApproachVelocity/ApproachVelocity.png',
      },
      {
        id: 8316,
        name: 'Cosmic Insight',
        icon: '/images/runes/Styles/Inspiration/CosmicInsight/CosmicInsight.png',
      },
    ],
  },
};

// ヘルパー関数: ルーンパスIDからキーストーンを取得
export const getKeystones = (pathId: number): Rune[] => {
  return KEYSTONES[pathId] || [];
};

// ヘルパー関数: ルーンパスIDとスロットからメインルーンを取得
export const getPrimaryRunes = (pathId: number, slot: number): Rune[] => {
  return PRIMARY_RUNES[pathId]?.[slot] || [];
};

// ヘルパー関数: ルーンパスIDから全てのメインルーンを取得（サブルーン選択用）
export const getSecondaryRunes = (pathId: number): Rune[] => {
  const pathRunes = PRIMARY_RUNES[pathId];
  if (!pathRunes) return [];

  // 全てのスロットのルーンを結合
  const allRunes = Object.values(pathRunes).flat();
  return allRunes;
};

// ヘルパー関数: ルーンIDからそのルーンが属する行(slot)を取得
export const getRuneSlot = (pathId: number, runeId: number): number | null => {
  const pathRunes = PRIMARY_RUNES[pathId];
  if (!pathRunes) return null;

  for (let slot = 0; slot <= 2; slot++) {
    const runes = pathRunes[slot] || [];
    if (runes.some((rune) => rune.id === runeId)) {
      return slot;
    }
  }
  return null;
};

// ステータスシャード（各段階に3個）
export const SHARDS: Record<number, Rune[]> = {
  0: [
    // Offense
    {
      id: 5008,
      name: 'Adaptive Force',
      icon: '/images/runes/StatMods/StatModsAdaptiveForceIcon.png',
    },
    {
      id: 5005,
      name: 'Attack Speed',
      icon: '/images/runes/StatMods/StatModsAttackSpeedIcon.png',
    },
    {
      id: 5007,
      name: 'Ability Haste',
      icon: '/images/runes/StatMods/StatModsCDRScalingIcon.png',
    },
  ],
  1: [
    // Flex
    {
      id: 5008,
      name: 'Adaptive Force',
      icon: '/images/runes/StatMods/StatModsAdaptiveForceIcon.png',
    },
    {
      id: 5010,
      name: 'Move Speed',
      icon: '/images/runes/StatMods/StatModsMovementSpeedIcon.png',
    },
    {
      id: 5001,
      name: 'Health Scaling',
      icon: '/images/runes/StatMods/StatModsHealthPlusIcon.png',
    },
  ],
  2: [
    // Defense
    {
      id: 5001,
      name: 'Health',
      icon: '/images/runes/StatMods/StatModsHealthScalingIcon.png',
    },
    {
      id: 5002,
      name: 'Tenacity',
      icon: '/images/runes/StatMods/StatModsTenacityIcon.png',
    },
    {
      id: 5003,
      name: 'Health Scaling',
      icon: '/images/runes/StatMods/StatModsHealthPlusIcon.png',
    },
  ],
};

// ヘルパー関数: スロットからシャードを取得
export const getShards = (slot: number): Rune[] => {
  return SHARDS[slot] || [];
};
