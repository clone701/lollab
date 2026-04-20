# 実装計画: 汎用ノート作成機能

## 概要

設計書に基づき、汎用ノートの作成・閲覧・管理機能をTypeScript/Next.jsで実装する。

## タスク

- [x] 1. 型定義とSupabaseアダプターの実装
  - [x] 1.1 `frontend/src/types/generalNote.ts` を作成し `GeneralNote`・`GeneralNoteFormData` 型を定義する
    - _Requirements: 8.3, 8.4_
  - [x] 1.2 `frontend/src/adapters/supabase/generalNotes.ts` を作成し `getGeneralNotes`・`createGeneralNote`・`updateGeneralNote`・`deleteGeneralNote` を実装する
    - RLSによる自動ユーザーフィルタリング、`updated_at DESC` ソート
    - _Requirements: 10.1, 10.2, 12.1, 12.2_
  - [x] 1.3 `frontend/src/adapters/supabase/index.ts` に `generalNotes` をエクスポート追加する
    - _Requirements: 10.1_

- [x] 2. バリデーション・ユーティリティ関数の実装
  - [x] 2.1 タイトル・本文・タグのバリデーション関数を実装する（`generalNote.ts` 内またはユーティリティとして）
    - _Requirements: 9.1, 9.2, 6.3, 6.4_
  - [x] 2.2 Property 8 のプロパティテストを書く: タイトルバリデーション
    - **Property 8: タイトルバリデーション**
    - **Validates: Requirements 9.1, 9.4**
  - [x] 2.3 Property 9 のプロパティテストを書く: 本文文字数バリデーション
    - **Property 9: 本文文字数バリデーション**
    - **Validates: Requirements 9.2, 9.4**

- [x] 3. CharCounter・TagInput コンポーネントの実装
  - [x] 3.1 `components/notes/GeneralNoteForm/CharCounter.tsx` を実装する
    - `current/max` 形式で表示
    - _Requirements: 7.1, 7.2_
  - [x] 3.2 Property 10 のプロパティテストを書く: 文字数カウンターの正確性
    - **Property 10: 文字数カウンターの正確性**
    - **Validates: Requirements 7.1, 7.2**
  - [x] 3.3 `components/notes/GeneralNoteForm/TagInput.tsx` を実装する
    - Enter追加・×削除・最大10タグ・20文字制限・エラーメッセージ
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_
  - [x] 3.4 Property 6 のプロパティテストを書く: タグ数制約
    - **Property 6: タグ数制約**
    - **Validates: Requirements 6.3**
  - [x] 3.5 Property 7 のプロパティテストを書く: タグ文字数制約
    - **Property 7: タグ文字数制約**
    - **Validates: Requirements 6.4**
  - [x] 3.6 `components/notes/GeneralNoteForm/index.ts` を作成する（Public API）

- [x] 4. GeneralNoteForm コンポーネントの実装
  - [x] 4.1 `components/notes/GeneralNoteForm/GeneralNoteForm.tsx` を実装する
    - タイトル・本文・TagInput・CharCounter・保存・キャンセルボタン
    - バリデーションエラー表示、Supabase保存、Toast通知
    - _Requirements: 5.1〜5.7, 8.1〜8.8, 9.3, 9.4, 11.1〜11.4_
  - [x] 4.2 GeneralNoteForm のユニットテストを書く
    - バリデーション・保存成功・保存失敗のケース
    - _Requirements: 8.1, 8.2, 9.3_

- [x] 5. チェックポイント - テストが通ることを確認する
  - 全テストが通ることを確認し、疑問点があればユーザーに確認する。

- [x] 6. MarkdownRenderer・ChampionMention コンポーネントの実装
  - [x] 6.1 `components/notes/GeneralNoteDetail/MarkdownRenderer.tsx` を実装する
    - `react-markdown` で見出し・リスト・太字をレンダリング
    - _Requirements: 3.1, 3.2, 3.3_
  - [x] 6.2 `components/notes/GeneralNoteDetail/ChampionMention.tsx` を実装する
    - `/championId` パターンをチャンピオン画像+名前に変換、後続テキスト保持
    - 存在しないIDはテキストのまま表示
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  - [x] 6.3 Property 4 のプロパティテストを書く: チャンピオンメンション変換
    - **Property 4: チャンピオンメンション変換**
    - **Validates: Requirements 4.1, 4.2, 4.5**
  - [x] 6.4 Property 5 のプロパティテストを書く: 無効なチャンピオンIDはテキストのまま
    - **Property 5: 無効なチャンピオンIDはテキストのまま表示される**
    - **Validates: Requirements 4.3**

- [x] 7. GeneralNoteDetail コンポーネントの実装
  - [x] 7.1 `components/notes/GeneralNoteDetail/GeneralNoteDetail.tsx` を実装する
    - タイトル・本文（MarkdownRenderer）・タグ・更新日時・編集・削除ボタン
    - _Requirements: 2.1〜2.8_
  - [x] 7.2 Property 3 のプロパティテストを書く: NoteDetailは全フィールドを表示する
    - **Property 3: NoteDetailは全フィールドを表示する**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7**
  - [x] 7.3 `components/notes/GeneralNoteDetail/index.ts` を作成する（Public API）

- [x] 8. GeneralNoteCard・GeneralNoteList コンポーネントの実装
  - [x] 8.1 `components/notes/GeneralNoteCard/GeneralNoteCard.tsx` を実装する
    - タイトル・本文プレビュー（先頭100文字）・タグ・作成日時・更新日時
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6_
  - [x] 8.2 Property 1 のプロパティテストを書く: NoteCardは全フィールドを表示する
    - **Property 1: NoteCardは全フィールドを表示する**
    - **Validates: Requirements 1.2, 1.3, 1.4, 1.5, 1.6**
  - [x] 8.3 `components/notes/GeneralNoteCard/index.ts` を作成する（Public API）
  - [x] 8.4 `components/notes/GeneralNoteList/GeneralNoteList.tsx` を実装する
    - ノート一覧・空状態メッセージ・ローディング・エラー表示・新規作成ボタン
    - `updated_at DESC` ソート
    - _Requirements: 1.1, 1.7, 1.8, 10.1〜10.4, 12.1_
  - [x] 8.5 Property 2 のプロパティテストを書く: ノート一覧は更新日時降順でソートされる
    - **Property 2: ノート一覧は更新日時降順でソートされる**
    - **Validates: Requirements 1.8**
  - [x] 8.6 `components/notes/GeneralNoteList/index.ts` を作成する（Public API）

- [x] 9. 状態管理・ページ統合
  - [x] 9.1 `app/notes/useGeneralNotesPage.tsx` を実装する
    - `viewMode`・`selectedNote`・`refreshKey`・`noteLoading`・`showDeleteDialog` を管理
    - _Requirements: 2.1, 5.2, 8.6, 8.7_
  - [x] 9.2 `app/notes/GeneralNoteTabContent.tsx` を実装する
    - 2カラムレイアウト、GeneralNoteList・GeneralNoteForm・GeneralNoteDetail を配置
    - _Requirements: 1.1, 2.8, 5.1_
  - [x] 9.3 `app/notes/NotesPageContent.tsx` を修正し `activeTab === 'general'` 時に `GeneralNoteTabContent` を表示する
    - _Requirements: 1.1_

- [x] 10. 最終チェックポイント - 全テストが通ることを確認する
  - 全テストが通ることを確認し、疑問点があればユーザーに確認する。

## 備考

- `*` 付きサブタスクはオプション（スキップ可）
- プロパティテストは `fast-check` を使用し、各100イテレーション以上実行
- 1ファイル60行以内・Public APIパターン（FE-coding-guidelines.md）を遵守
