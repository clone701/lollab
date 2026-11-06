/** a が a + b に占める割合（0〜1）。両方0なら 0.5 */
export function calcShare(a: number, b: number): number {
  const total = a + b;
  return total <= 0 ? 0.5 : a / total;
}
