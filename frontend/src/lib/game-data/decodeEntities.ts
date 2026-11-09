const ENTITIES: Record<string, string> = {
  '&nbsp;': '\u00a0',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
};

/** 使われている文字参照（&nbsp; &amp; &lt; &gt;）だけを文字に戻す。1回の置換で、二重には戻さない */
export function decodeEntities(text: string): string {
  return text.replace(/&(?:nbsp|amp|lt|gt);/g, (m) => ENTITIES[m]);
}
