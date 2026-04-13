# 実装計画: ノート一覧・作成機能

## 概要

本ドキュメントは、チャンピオン対策ノートの一覧表示と新規作成機能の実装タスクを定義します。

Spec 2-1で実装した基本レイアウトとチャンピオン選択UIを活用し、ノートの作成と一覧表示機能を段階的に実装します。

## タスク

- [x] 1. データ準備とAPI基盤の構築
  - [x] 1.1 型定義ファイルを作成
    - `frontend/src/types/note.ts`を作成
    - ChampionNote、RuneConfig、RunePath、Rune、SummonerSpell、Item型を定義
    - _要件: 1, 3, 4, 5, 6_
  
  - [x] 1.2 ルーンデータファイルを作成
    - `frontend/src/lib/data/runes.ts`を作成
    - RUNE_PATHS、KEYSTONES、PRIMARY_RUNES、SHARDSデータを定義
    - 各ルーンパス（Precision, Domination, Sorcery, Resolve, Inspiration）のデータを含める
    - _要件: 3_
  
  - [x] 1.3 サモナースペルデータファイルを作成
    - `frontend/src/lib/data/summonerSpells.ts`を作成
    - SUMMONER_SPELLSデータを定義（Flash, Ignite, Exhaust等）
    - _要件: 4_
  
  - [x] 1.4 アイテムデータファイルを作成
    - `frontend/src/lib/data/items.ts`を作成
    - STARTER_ITEMSデータを定義（Doran's Blade, Long Sword等）
    - _要件: 5_
  
  - [x] 1.5 Supabase Clientを設定
    - `frontend/src/lib/supabase/client.ts`を作成
    - createClient関数を実装
    - 環境変数（NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY）を使用
    - _要件: 6, 8_
  
  - [x] 1.6 ノートAPI関数を実装
    - `frontend/src/lib/api/notes.ts`を作成
    - getNotes関数を実装（一覧取得、フィルタリング、ソート）
    - createNote関数を実装（ユーザーID取得、バリデーション、INSERT）
    - エラーハンドリングを実装
    - _要件: 6, 8, 13_

- [x] 2. Checkpoint - データ層の動作確認
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. 基本UIコンポーネントの実装
  - [x] 3.1 Toastコンポーネントを実装
    - `frontend/src/components/ui/Toast.tsx`を作成
    - success、error、info型のトースト表示
    - 3秒後の自動クローズ機能
    - _要件: 6, 13_
  
  - [x] 3.2 useToastカスタムフックを実装
    - `frontend/src/lib/hooks/useToast.ts`を作成
    - showToast、hideToast関数を提供
    - トースト状態管理
    - _要件: 6, 13_
  
  - [x] 3.3 NoteCardコンポーネントを実装
    - `frontend/src/components/notes/NoteCard.tsx`を作成
    - チャンピオンアイコン表示（w-8 h-8）
    - プリセット名表示
    - 作成日時・更新日時表示
    - クリックイベントなし（Spec 2-2Bで実装）
    - _要件: 1_
  
  - [x] 3.4 NoteListコンポーネントを実装
    - `frontend/src/components/notes/NoteList.tsx`を作成
    - ノート一覧表示（グリッドレイアウト: grid-cols-1 md:grid-cols-2 lg:grid-cols-3）
    - 「新規ノート作成」ボタン
    - ローディング状態表示
    - エラー状態表示
    - 空状態表示（チャンピオン未選択、ノートなし）
    - _要件: 1, 7, 8, 10, 11_

- [x] 4. Checkpoint - 基本UIの動作確認
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. ルーン選択UIの実装
  - [x] 5.1 RuneSelectorコンポーネントを実装
    - `frontend/src/components/notes/RuneSelector.tsx`を作成
    - メインルーンパス選択（5つから1つ）
    - キーストーン選択（4つから1つ）
    - メインルーン選択（3段階、各3つから1つ）
    - サブルーンパス選択（メイン以外の4つから1つ）
    - サブルーン選択（2つ選択）
    - ステータスシャード選択（3段階、各3つから1つ）
    - 選択状態のハイライト表示（bg-gray-100 border-2 border-black）
    - _要件: 3, 11_

- [x] 6. サモナースペル・アイテム選択UIの実装
  - [x] 6.1 SummonerSpellPickerコンポーネントを実装
    - `frontend/src/components/notes/SummonerSpellPicker.tsx`を作成
    - 2つのスペル選択
    - 選択済みスペル表示（w-12 h-12）
    - スペル一覧表示（grid-cols-4）
    - 3つ目選択時は最初のスペルを置き換え
    - 選択状態のハイライト表示（border-2 border-black）
    - _要件: 4, 11_
  
  - [x] 6.2 ItemBuildSelectorコンポーネントを実装
    - `frontend/src/components/notes/ItemBuildSelector.tsx`を作成
    - 複数アイテム選択
    - 選択済みアイテム表示（w-12 h-12）
    - アイテム一覧表示（grid-cols-6）
    - アイテム選択解除機能
    - 選択状態のハイライト表示（border-2 border-black）
    - _要件: 5, 11_

- [x] 7. Checkpoint - 選択UIの動作確認
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. ノート作成フォームの実装
  - [x] 8.1 NoteFormコンポーネントを実装
    - `frontend/src/components/notes/NoteForm.tsx`を作成
    - プリセット名入力欄（input + 保存ボタン）
    - RuneSelector統合
    - SummonerSpellPicker統合
    - ItemBuildSelector統合
    - 対策メモ入力欄（textarea、6行）
    - キャンセルボタン
    - _要件: 2, 9_
  
  - [x] 8.2 フォームバリデーションを実装
    - プリセット名必須チェック
    - プリセット名100文字以内チェック
    - 対策メモ10,000文字以内チェック
    - エラーメッセージ表示
    - _要件: 9_
  
  - [x] 8.3 保存処理を実装
    - createNote API呼び出し
    - ユーザーID自動設定
    - チャンピオンID設定
    - JSONB形式でのデータ保存（runes, spells, items）
    - 成功時のトースト通知
    - 失敗時のトースト通知
    - 保存後の一覧更新
    - _要件: 6, 13_

- [x] 9. Checkpoint - フォームの動作確認
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. ページ統合とデータフロー
  - [x] 10.1 Notes Pageを拡張
    - `frontend/src/app/notes/page.tsx`を拡張
    - showForm状態管理（一覧とフォームの切り替え）
    - NoteList統合
    - NoteForm統合
    - チャンピオン選択状態の管理
    - _要件: 2, 7, 10_
  
  - [x] 10.2 チャンピオン選択との連携を実装
    - チャンピオン選択時の一覧自動更新
    - 両方のチャンピオン選択時のみノート表示
    - チャンピオン未選択時の空状態表示
    - _要件: 7, 10_
  
  - [x] 10.3 データフェッチングを実装
    - useEffectでのノート取得
    - チャンピオンID変更時の再取得
    - ローディング状態管理
    - エラーハンドリング
    - クリーンアップ処理（isMountedフラグ）
    - _要件: 8, 13_

- [x] 11. Checkpoint - ページ統合の動作確認
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. 最適化とレスポンシブ対応
  - [x] 12.1 パフォーマンス最適化を実装
    - React.memoでコンポーネントメモ化（NoteCard, RuneSelector等）
    - useMemoでフィルタリング最適化
    - useCallbackでイベントハンドラーメモ化
    - 画像の遅延読み込み（loading="lazy"）
    - _要件: 12_
  
  - [x] 12.2 レスポンシブデザインを確認
    - モバイル（768px未満）での1カラムレイアウト
    - タブレット（768px-1024px）での2カラムレイアウト
    - デスクトップ（1024px以上）での3カラムレイアウト
    - ルーン選択のスクロール対応
    - フォームの縦並びレイアウト（モバイル）
    - _要件: 11_
  
  - [x] 12.3 アクセシビリティを確認
    - aria-label属性の追加
    - フォーカス状態の視覚化
    - キーボード操作対応
    - スクリーンリーダー対応
    - _要件: 11_

- [x] 13. 最終チェックポイント
  - Ensure all tests pass, ask the user if questions arise.

## 注意事項

### 実装範囲

本Specでは以下を実装します：
- ノート一覧表示
- 新規ノート作成フォーム
- ルーン・サモナースペル・アイテム選択UI
- トースト通知
- Supabase連携（作成・一覧取得）

### 実装範囲外（Spec 2-2Bで実装）

以下の機能は本Specの範囲外です：
- ノート編集機能
- ノート削除機能
- ノートカードのクリックイベント
- ノート詳細表示

### デザインシステム遵守

- 選択状態のハイライト: **黒（border-black）**を使用
- チャンピオンアイコン: w-8 h-8（32px）
- ルーン画像: w-12 h-12（48px）、メインルーンはw-10 h-10（40px）
- サモナースペル: w-12 h-12（48px）
- アイテム: w-10 h-10（40px）
- トースト: 3秒後に自動クローズ

### 依存関係

本Specは以下のSpecに依存します：
- **Spec 2-1**: TabNavigation、ChampionSelectorSidebar
- **Spec 3-1**: champion_notesテーブル、RLSポリシー
- **Spec 1-1**: 認証システム
- **Spec 1-2**: Panel、GlobalLoading

### パフォーマンス目標

- ノート一覧表示: 1秒以内
- 保存処理: 2秒以内
- ページ遷移: 即座

## 実装後の確認項目

- [ ] チャンピオン選択時にノート一覧が更新される
- [ ] 新規ノート作成ボタンでフォームが表示される
- [ ] ルーン・スペル・アイテムが正しく選択できる
- [ ] プリセット名のバリデーションが動作する
- [ ] 保存時にトースト通知が表示される
- [ ] 保存後にノート一覧が更新される
- [ ] エラー時に適切なメッセージが表示される
- [ ] モバイルデバイスで正しく表示される
- [ ] ローディング状態が適切に表示される
- [ ] 空状態のメッセージが適切に表示される
