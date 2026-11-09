/** ステータス表の1行。値は表示用の文字 */
export interface StatRow {
  label: string;
  /** Lv.1 の値 */
  base: string;
  /** レベルごとの増加（例: +102）。無いステータスは null */
  growth: string | null;
  /** Lv.18 の値。無いステータスは null */
  max: string | null;
}
