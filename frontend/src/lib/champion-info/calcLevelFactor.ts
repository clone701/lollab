/** レベルごとの成長にかける係数: (n-1) × (0.7025 + 0.0175 × (n-1)) */
export function calcLevelFactor(level: number): number {
  const steps = level - 1;
  return steps * (0.7025 + 0.0175 * steps);
}
