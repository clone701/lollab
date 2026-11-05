export interface RuneKeyParts {
  primaryStyle: number;
  primary: number[];
  subStyle: number;
  sub: number[];
  shards: number[];
}

const RUNE_KEY_LENGTH = 11;

/** ルーンのキー [primary_style, p1〜p4, sub_style, s1, s2, shard1〜3] を分解する */
export function splitRuneKey(key: number[]): RuneKeyParts | null {
  if (key.length !== RUNE_KEY_LENGTH) return null;
  return {
    primaryStyle: key[0],
    primary: key.slice(1, 5),
    subStyle: key[5],
    sub: key.slice(6, 8),
    shards: key.slice(8, 11),
  };
}
