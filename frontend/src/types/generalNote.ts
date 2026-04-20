// 汎用ノート型定義

/**
 * 汎用ノート（チャンピオンに紐付かない自由なメモ）
 */
export interface GeneralNote {
  id: number;
  user_id: string;
  title: string;
  body: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

/**
 * 汎用ノートフォームデータ
 */
export interface GeneralNoteFormData {
  title: string;
  body: string;
  tags: string[];
}
