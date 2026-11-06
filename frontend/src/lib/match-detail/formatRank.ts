import type { RankBrief } from '@/types/matchDetail';
import {
  DIVISION_NUMBERS,
  TIERS_WITHOUT_DIVISION,
  TIER_LABELS,
} from './rankLabels';

/** ランクを日本語にする（例: マスター、エメラルド 1） */
export function formatRank(rank: RankBrief): string {
  const tier = rank.tier.toUpperCase();
  const label = TIER_LABELS[tier] ?? rank.tier;
  if (!rank.division || TIERS_WITHOUT_DIVISION.includes(tier)) return label;
  return `${label} ${DIVISION_NUMBERS[rank.division] ?? rank.division}`;
}
