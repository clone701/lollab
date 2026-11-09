import type { DdragonRuneData, RuneInfo } from './types';

/** ルーン・パスの ID から画面用の情報を作る。パスは名前だけ。無ければ null */
export function toRuneInfo(data: DdragonRuneData, id: number): RuneInfo | null {
  for (const path of data) {
    if (path.id === id) return { name: path.name };
    for (const slot of path.slots) {
      const rune = slot.runes.find((r) => r.id === id);
      if (rune) return { name: rune.name, description: rune.longDesc };
    }
  }
  return null;
}
