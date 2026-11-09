import { toHue } from './toHue';
import type { DescriptionContainerType } from './types';

/**
 * font タグの色（#RRGGBB）を、色相で説明文の役割にする。
 * 当てはまらない色・不正な値は null（タグを外すだけにする）
 */
export function toFontColorType(hex: string): DescriptionContainerType | null {
  const hue = toHue(hex);
  if (hue === null) return null;
  // 赤（#FE5C50・#DD2E2E）と橙（#FF9900）は物理
  if (hue < 45 || hue >= 345) return 'physical';
  // 黄（#FFF673）は数値
  if (hue < 70) return 'number';
  // 黄緑〜緑（#669900・#00DD33・#1CA935）は回復
  if (hue < 160) return 'heal';
  // 青緑〜水色（#48C4B7・#91D7EE）は用語
  if (hue < 198) return 'term';
  // 青（#38A8E8）はシールド
  if (hue < 255) return 'shield';
  // 紫・桃（#EE91D7・#9B0F5F）は状態異常
  return 'status';
}
