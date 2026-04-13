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
    icon: '/images/runes/runePath/7201_Precision.png',
  },
  {
    id: 8100,
    name: 'Domination',
    icon: '/images/runes/runePath/7200_Domination.png',
  },
  {
    id: 8200,
    name: 'Sorcery',
    icon: '/images/runes/runePath/7202_Sorcery.png',
  },
  {
    id: 8300,
    name: 'Resolve',
    icon: '/images/runes/runePath/7204_Resolve.png',
  },
  {
    id: 8400,
    name: 'Inspiration',
    icon: '/images/runes/runePath/7203_Whimsy.png',
  },
];

// キーストーンルーン（各パスに3-4個）
export const KEYSTONES: Record<number, Rune[]> = {
  8000: [
    // Precision
    {
      id: 8005,
      name: 'Press the Attack',
      icon: '/images/runes/precision/keyStones/PressTheAttack.png',
    },
    {
      id: 8008,
      name: 'Lethal Tempo',
      icon: '/images/runes/precision/keyStones/LethalTempoTemp.png',
    },
    {
      id: 8021,
      name: 'Fleet Footwork',
      icon: '/images/runes/precision/keyStones/FleetFootwork.png',
    },
    {
      id: 8010,
      name: 'Conqueror',
      icon: '/images/runes/precision/keyStones/Conqueror.png',
    },
  ],
  8100: [
    // Domination
    {
      id: 8112,
      name: 'Electrocute',
      icon: '/images/runes/domination/keyStones/Electrocute.png',
    },
    {
      id: 8124,
      name: 'Dark Harvest',
      icon: '/images/runes/domination/keyStones/DarkHarvest.png',
    },
    {
      id: 8128,
      name: 'Hail of Blades',
      icon: '/images/runes/domination/keyStones/HailOfBlades.png',
    },
  ],
  8200: [
    // Sorcery
    {
      id: 8214,
      name: 'Summon Aery',
      icon: '/images/runes/sorcery/keyStones/SummonAery.png',
    },
    {
      id: 8229,
      name: 'Arcane Comet',
      icon: '/images/runes/sorcery/keyStones/ArcaneComet.png',
    },
    {
      id: 8230,
      name: 'Phase Rush',
      icon: '/images/runes/sorcery/keyStones/PhaseRush.png',
    },
  ],
  8300: [
    // Resolve
    {
      id: 8437,
      name: 'Grasp of the Undying',
      icon: '/images/runes/resolve/keyStones/GraspOfTheUndying.png',
    },
    {
      id: 8439,
      name: 'Veteran Aftershock',
      icon: '/images/runes/resolve/keyStones/VeteranAftershock.png',
    },
    {
      id: 8465,
      name: 'Guardian',
      icon: '/images/runes/resolve/keyStones/Guardian.png',
    },
  ],
  8400: [
    // Inspiration
    {
      id: 8351,
      name: 'Glacial Augment',
      icon: '/images/runes/inspiration/keyStones/GlacialAugment.png',
    },
    {
      id: 8360,
      name: 'Unsealed Spellbook',
      icon: '/images/runes/inspiration/keyStones/UnsealedSpellbook.png',
    },
    {
      id: 8369,
      name: 'First Strike',
      icon: '/images/runes/inspiration/keyStones/FirstStrike.png',
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
        icon: '/images/runes/precision/runes/firstRune/AbsorbLife.png',
      },
      {
        id: 9111,
        name: 'Triumph',
        icon: '/images/runes/precision/runes/firstRune/Triumph.png',
      },
      {
        id: 8009,
        name: 'Presence of Mind',
        icon: '/images/runes/precision/runes/firstRune/PresenceOfMind.png',
      },
    ],
    1: [
      {
        id: 9104,
        name: 'Legend: Alacrity',
        icon: '/images/runes/precision/runes/secondRune/LegendAlacrity.png',
      },
      {
        id: 9105,
        name: 'Legend: Haste',
        icon: '/images/runes/precision/runes/secondRune/LegendHaste.png',
      },
      {
        id: 9103,
        name: 'Legend: Bloodline',
        icon: '/images/runes/precision/runes/secondRune/LegendBloodline.png',
      },
    ],
    2: [
      {
        id: 8014,
        name: 'Coup de Grace',
        icon: '/images/runes/precision/runes/thirdRune/CoupDeGrace.png',
      },
      {
        id: 8017,
        name: 'Cut Down',
        icon: '/images/runes/precision/runes/thirdRune/CutDown.png',
      },
      {
        id: 8299,
        name: 'Last Stand',
        icon: '/images/runes/precision/runes/thirdRune/LastStand.png',
      },
    ],
  },
  8100: {
    // Domination
    0: [
      {
        id: 8126,
        name: 'Cheap Shot',
        icon: '/images/runes/domination/runes/firstRune/CheapShot.png',
      },
      {
        id: 8139,
        name: 'Taste of Blood',
        icon: '/images/runes/domination/runes/firstRune/TasteOfBlood.png',
      },
      {
        id: 8143,
        name: 'Sudden Impact',
        icon: '/images/runes/domination/runes/firstRune/SuddenImpact.png',
      },
    ],
    1: [
      {
        id: 8136,
        name: 'Sixth Sense',
        icon: '/images/runes/domination/runes/secondRune/SixthSense.png',
      },
      {
        id: 8120,
        name: 'Grisly Mementos',
        icon: '/images/runes/domination/runes/secondRune/GrislyMementos.png',
      },
      {
        id: 8138,
        name: 'Deep Ward',
        icon: '/images/runes/domination/runes/secondRune/DeepWard.png',
      },
    ],
    2: [
      {
        id: 8135,
        name: 'Treasure Hunter',
        icon: '/images/runes/domination/runes/thirdRune/TreasureHunter.png',
      },
      {
        id: 8134,
        name: 'Ultimate Hunter',
        icon: '/images/runes/domination/runes/thirdRune/UltimateHunter.png',
      },
      {
        id: 8105,
        name: 'Relentless Hunter',
        icon: '/images/runes/domination/runes/thirdRune/RelentlessHunter.png',
      },
    ],
  },
  8200: {
    // Sorcery
    0: [
      {
        id: 8224,
        name: 'Nullifying Orb',
        icon: '/images/runes/sorcery/runes/firstRune/NimbusCloak.png',
      },
      {
        id: 8226,
        name: 'Manaflow Band',
        icon: '/images/runes/sorcery/runes/firstRune/ManaflowBand.png',
      },
      {
        id: 8275,
        name: 'Axiom Arcanist',
        icon: '/images/runes/sorcery/runes/firstRune/Axiom_Arcanist.png',
      },
    ],
    1: [
      {
        id: 8210,
        name: 'Transcendence',
        icon: '/images/runes/sorcery/runes/secondRune/Transcendence.png',
      },
      {
        id: 8234,
        name: 'Celerity',
        icon: '/images/runes/sorcery/runes/secondRune/CelerityTemp.png',
      },
      {
        id: 8233,
        name: 'Absolute Focus',
        icon: '/images/runes/sorcery/runes/secondRune/AbsoluteFocus.png',
      },
    ],
    2: [
      {
        id: 8237,
        name: 'Scorch',
        icon: '/images/runes/sorcery/runes/thirdRune/Scorch.png',
      },
      {
        id: 8232,
        name: 'Waterwalking',
        icon: '/images/runes/sorcery/runes/thirdRune/Waterwalking.png',
      },
      {
        id: 8236,
        name: 'Gathering Storm',
        icon: '/images/runes/sorcery/runes/thirdRune/GatheringStorm.png',
      },
    ],
  },
  8300: {
    // Resolve
    0: [
      {
        id: 8446,
        name: 'Demolish',
        icon: '/images/runes/resolve/runes/firstRune/Demolish.png',
      },
      {
        id: 8463,
        name: 'Font of Life',
        icon: '/images/runes/resolve/runes/firstRune/FontOfLife.png',
      },
      {
        id: 8401,
        name: 'Mirror Shell',
        icon: '/images/runes/resolve/runes/firstRune/MirrorShell.png',
      },
    ],
    1: [
      {
        id: 8429,
        name: 'Conditioning',
        icon: '/images/runes/resolve/runes/secondRune/Conditioning.png',
      },
      {
        id: 8444,
        name: 'Second Wind',
        icon: '/images/runes/resolve/runes/secondRune/SecondWind.png',
      },
      {
        id: 8473,
        name: 'Bone Plating',
        icon: '/images/runes/resolve/runes/secondRune/BonePlating.png',
      },
    ],
    2: [
      {
        id: 8451,
        name: 'Overgrowth',
        icon: '/images/runes/resolve/runes/thirdRune/Overgrowth.png',
      },
      {
        id: 8453,
        name: 'Revitalize',
        icon: '/images/runes/resolve/runes/thirdRune/Revitalize.png',
      },
      {
        id: 8242,
        name: 'Unflinching',
        icon: '/images/runes/resolve/runes/thirdRune/Unflinching.png',
      },
    ],
  },
  8400: {
    // Inspiration
    0: [
      {
        id: 8306,
        name: 'Hextech Flashtraption',
        icon: '/images/runes/inspiration/runes/firstRune/HextechFlashtraption.png',
      },
      {
        id: 8304,
        name: 'Magical Footwear',
        icon: '/images/runes/inspiration/runes/firstRune/MagicalFootwear.png',
      },
      {
        id: 8321,
        name: 'Cash Back',
        icon: '/images/runes/inspiration/runes/firstRune/CashBack2.png',
      },
    ],
    1: [
      {
        id: 8313,
        name: 'Time Warp Tonic',
        icon: '/images/runes/inspiration/runes/secondRune/TimeWarpTonic.png',
      },
      {
        id: 8352,
        name: 'Biscuit Delivery',
        icon: '/images/runes/inspiration/runes/secondRune/BiscuitDelivery.png',
      },
      {
        id: 8345,
        name: 'Alchemist Cabinet',
        icon: '/images/runes/inspiration/runes/secondRune/AlchemistCabinet.png',
      },
    ],
    2: [
      {
        id: 8347,
        name: 'Cosmic Insight',
        icon: '/images/runes/inspiration/runes/thirdRune/CosmicInsight.png',
      },
      {
        id: 8410,
        name: 'Approach Velocity',
        icon: '/images/runes/inspiration/runes/thirdRune/ApproachVelocity.png',
      },
      {
        id: 8316,
        name: 'Jack of All Trades',
        icon: '/images/runes/inspiration/runes/thirdRune/JackofAllTrades2.png',
      },
    ],
  },
};

// ステータスシャード（3段階、各3個）
export const SHARDS: Record<number, Rune[]> = {
  0: [
    // Offense
    {
      id: 5008,
      name: 'Adaptive Force',
      icon: '/images/runes/shards/StatModsAdaptiveForceIcon.png',
    },
    {
      id: 5005,
      name: 'Attack Speed',
      icon: '/images/runes/shards/StatModsAttackSpeedIcon.png',
    },
    {
      id: 5007,
      name: 'Ability Haste',
      icon: '/images/runes/shards/StatModsCDRScalingIcon.png',
    },
  ],
  1: [
    // Flex
    {
      id: 5008,
      name: 'Adaptive Force',
      icon: '/images/runes/shards/StatModsAdaptiveForceIcon.png',
    },
    {
      id: 5010,
      name: 'Move Speed',
      icon: '/images/runes/shards/StatModsMovementSpeedIcon.png',
    },
    {
      id: 5001,
      name: 'Health Scaling',
      icon: '/images/runes/shards/StatModsHealthPlusIcon.png',
    },
  ],
  2: [
    // Defense
    {
      id: 5001,
      name: 'Health',
      icon: '/images/runes/shards/StatModsHealthScalingIcon.png',
    },
    {
      id: 5002,
      name: 'Tenacity',
      icon: '/images/runes/shards/StatModsTenacityIcon.png',
    },
    {
      id: 5003,
      name: 'Health Scaling',
      icon: '/images/runes/shards/StatModsHealthPlusIcon.png',
    },
  ],
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

  // 全ての段階のルーンを1つの配列に結合
  return [
    ...(pathRunes[0] || []),
    ...(pathRunes[1] || []),
    ...(pathRunes[2] || []),
  ];
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

// ヘルパー関数: スロットからシャードを取得
export const getShards = (slot: number): Rune[] => {
  return SHARDS[slot] || [];
};
