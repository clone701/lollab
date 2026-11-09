import { calcLevelFactor } from './calcLevelFactor';

/** レベル n のステータス: 基礎 + 成長 × (n-1) × (0.7025 + 0.0175 × (n-1)) */
export function calcStatAtLevel(
  base: number,
  growth: number,
  level: number
): number {
  return base + growth * calcLevelFactor(level);
}
