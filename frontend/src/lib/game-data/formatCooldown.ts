/** クールダウンを表示用にする。例: '10/9.5/9/8.5/8' → '10/9.5/9/8.5/8 秒' */
export function formatCooldown(cooldownBurn: string): string {
  return `${cooldownBurn} 秒`;
}
