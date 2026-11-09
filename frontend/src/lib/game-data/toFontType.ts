import { toFontColorType } from './toFontColorType';
import type { DescriptionContainerType } from './types';

/** color 属性（'…' か "…" で囲んだ値）。引用符なしは読まない */
const COLOR_ATTRIBUTE = /\bcolor\s*=\s*(?:'([^']*)'|"([^"]*)")/i;

/** font の開始タグ（文字列全体）から、色の役割を決める。色が無い・不正なら null */
export function toFontType(tag: string): DescriptionContainerType | null {
  const match = COLOR_ATTRIBUTE.exec(tag);
  if (!match) return null;
  return toFontColorType((match[1] ?? match[2]).trim());
}
