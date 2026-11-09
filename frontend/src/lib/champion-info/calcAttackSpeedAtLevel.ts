import { calcLevelFactor } from './calcLevelFactor';

/** レベル n の攻撃速度: 基礎 × (1 + 成長% × 係数 / 100)。growthPercent は % の数 */
export function calcAttackSpeedAtLevel(
  base: number,
  growthPercent: number,
  level: number
): number {
  return base * (1 + (growthPercent * calcLevelFactor(level)) / 100);
}
