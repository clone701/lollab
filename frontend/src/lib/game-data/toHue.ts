/**
 * #RRGGBB の色の色相（0 以上 360 未満）を返す。
 * 彩度が低い（白・灰・黒に近い）色、形式が違う値は null
 */
export function toHue(hex: string): number | null {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return null;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const max = Math.max(r, g, b);
  const delta = max - Math.min(r, g, b);
  // 色の幅が小さい色は、色相では分けられない
  if (delta < 40) return null;
  let hue: number;
  if (max === r) hue = ((g - b) / delta) % 6;
  else if (max === g) hue = (b - r) / delta + 2;
  else hue = (r - g) / delta + 4;
  return (hue * 60 + 360) % 360;
}
