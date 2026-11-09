// Data Dragon の runesReforged.json の型（使う項目だけ）

export interface DdragonRune {
  id: number;
  name: string;
  longDesc: string;
}

export interface DdragonRunePath {
  id: number;
  name: string;
  slots: { runes: DdragonRune[] }[];
}

/** runesReforged.json はパスの配列 */
export type DdragonRuneData = DdragonRunePath[];
