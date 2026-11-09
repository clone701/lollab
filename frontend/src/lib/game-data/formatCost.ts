/** コストを表示用にする。例: ('70', 'マナ') → '70 マナ'。コストが 0 なら null */
export function formatCost(costBurn: string, partype: string): string | null {
  if (costBurn === '0') return null;
  return partype ? `${costBurn} ${partype}` : costBurn;
}
