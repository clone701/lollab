# 要件定義書: ノート編集・削除機能

## はじめに

本ドキュメントは、チャンピオン対策ノートの閲覧・編集・削除機能の要件を定義します。

本機能は、Spec 2-2Aで実装したノート一覧・作成機能を拡張し、既存ノートの編集と削除機能を提供します。

## 用語集

- **Matchup_Note**: チャンピオン対策ノート（特定のマッチアップに対する詳細な対策情報）
- **Note_Form**: ノート閲覧・編集フォーム
- **Note_List**: ノート一覧表示
- **Delete_Confirm_Dialog**: 削除確認ダイアログ
- **Toast**: トースト通知コンポーネント
- **Supabase_Client**: Supabaseデータベースクライアント

## 要件

### 要件1: ノート閲覧画面表示

**ユーザーストーリー:** プレイヤーとして、既存のノートを閲覧したい。そうすることで、過去に記録した戦略を確認できる。

#### 受け入れ基準

1. WHEN ノートカードをクリックする場合、THE Note_Form SHALL 閲覧画面を表示する
2. THE Note_Form SHALL 「一覧へ戻る」ボタンを表示する
3. WHEN 「一覧へ戻る」ボタンをクリックする場合、THE Note_Form SHALL ノート一覧画面に戻る
4. THE Note_Form SHALL チャンピオンアイコンとマッチアップ情報を表示する
5. THE Note_Form SHALL プリセット名を表示する
6. THE Note_Form SHALL 既存のルーン構成を表示する
7. THE Note_Form SHALL 既存のサモナースペルを表示する
8. THE Note_Form SHALL 既存の初期アイテムを表示する
9. THE Note_Form SHALL 既存の対策メモを表示する
10. THE Note_Form SHALL 「編集」ボタンを表示する
11. THE Note_Form SHALL 「削除」ボタンを表示する

### 要件2: ノート編集機能

**ユーザーストーリー:** プレイヤーとして、既存のノートを編集したい。そうすることで、戦略を改善できる。

#### 受け入れ基準

1. WHEN 「編集」ボタンをクリックする場合、THE Note_Form SHALL フォームを編集可能状態にする
2. WHEN 編集モードの場合、THE Note_Form SHALL プリセット名を編集可能にする
3. WHEN 編集モードの場合、THE Note_Form SHALL ルーン選択を変更可能にする
4. WHEN 編集モードの場合、THE Note_Form SHALL サモナースペル選択を変更可能にする
5. WHEN 編集モードの場合、THE Note_Form SHALL 初期アイテム選択を変更可能にする
6. WHEN 編集モードの場合、THE Note_Form SHALL 対策メモを編集可能にする
7. WHEN 編集モードの場合、THE Note_Form SHALL 「保存」ボタンを表示する
8. WHEN 編集モードの場合、THE Note_Form SHALL 「キャンセル」ボタンを表示する
9. WHEN 「キャンセル」ボタンをクリックする場合、THE Note_Form SHALL 編集内容を破棄し閲覧モードに戻る

### 要件3: ノート更新機能

**ユーザーストーリー:** プレイヤーとして、編集したノートを保存したい。そうすることで、改善した戦略を記録できる。

#### 受け入れ基準

1. WHEN 「保存」ボタンをクリックする場合、THE Note_Form SHALL 入力内容を検証する
2. THE Note_Form SHALL プリセット名が入力されていることを検証する
3. THE Note_Form SHALL プリセット名が100文字以内であることを検証する
4. THE Note_Form SHALL 対策メモが10,000文字以内であることを検証する
5. WHEN 入力内容が有効な場合、THE Note_Form SHALL Supabaseのノートを更新する
6. THE Note_Form SHALL 更新時にupdated_atを現在時刻に設定する
7. WHEN 更新が成功した場合、THE Note_Form SHALL トースト通知で成功メッセージを表示する
8. WHEN 更新が成功した場合、THE Note_Form SHALL 閲覧モードに戻る
9. WHEN 更新が成功した場合、THE Note_Form SHALL ノート一覧を更新する
10. WHEN 更新が失敗した場合、THE Note_Form SHALL トースト通知でエラーメッセージを表示する

### 要件4: ノート削除機能

**ユーザーストーリー:** プレイヤーとして、不要なノートを削除したい。そうすることで、ノート一覧を整理できる。

#### 受け入れ基準

1. WHEN 「削除」ボタンをクリックする場合、THE Note_Form SHALL 削除確認ダイアログを表示する
2. THE Delete_Confirm_Dialog SHALL 「本当に削除しますか？」というメッセージを表示する
3. THE Delete_Confirm_Dialog SHALL 「削除」ボタンを表示する
4. THE Delete_Confirm_Dialog SHALL 「キャンセル」ボタンを表示する
5. WHEN 「キャンセル」ボタンをクリックする場合、THE Delete_Confirm_Dialog SHALL ダイアログを閉じる
6. WHEN 「削除」ボタンをクリックする場合、THE Delete_Confirm_Dialog SHALL Supabaseからノートを削除する
7. WHEN 削除が成功した場合、THE Delete_Confirm_Dialog SHALL トースト通知で成功メッセージを表示する
8. WHEN 削除が成功した場合、THE Delete_Confirm_Dialog SHALL ノート一覧を更新する
9. WHEN 削除が成功した場合、THE Delete_Confirm_Dialog SHALL ノート一覧画面に戻る
10. WHEN 削除が失敗した場合、THE Delete_Confirm_Dialog SHALL トースト通知でエラーメッセージを表示する

### 要件5: フォームバリデーション

**ユーザーストーリー:** プレイヤーとして、無効なデータを保存できないようにしたい。そうすることで、データの整合性が保たれる。

#### 受け入れ基準

1. THE Note_Form SHALL プリセット名が空でないことを検証する
2. THE Note_Form SHALL プリセット名が100文字以内であることを検証する
3. THE Note_Form SHALL 対策メモが10,000文字以内であることを検証する
4. WHEN バリデーションエラーがある場合、THE Note_Form SHALL エラーメッセージを表示する
5. WHEN バリデーションエラーがある場合、THE Note_Form SHALL 保存を実行しない
6. THE Note_Form SHALL エラーメッセージを該当する入力欄の近くに表示する

### 要件6: UI/UXフロー

**ユーザーストーリー:** プレイヤーとして、直感的にノートを編集・削除したい。そうすることで、スムーズに操作できる。

#### 受け入れ基準

1. WHEN 閲覧モードの場合、THE Note_Form SHALL 全てのフィールドを読み取り専用で表示する
2. WHEN 編集モードの場合、THE Note_Form SHALL 全てのフィールドを編集可能で表示する
3. WHEN 編集中にキャンセルする場合、THE Note_Form SHALL 確認なしで編集内容を破棄する
4. THE Note_Form SHALL 編集中のデータを保持する
5. THE Note_Form SHALL 保存成功後に閲覧モードに戻る

### 要件7: レスポンシブデザイン

**ユーザーストーリー:** プレイヤーとして、モバイルデバイスでもノート編集・削除機能を快適に使用したい。そうすることで、どのデバイスからでもアクセスできる。

#### 受け入れ基準

1. WHEN 画面幅が768px未満の場合、THE Note_Form SHALL 1カラムレイアウトで表示する
2. THE Delete_Confirm_Dialog SHALL モバイルデバイスで適切なサイズで表示される
3. THE Note_Form SHALL モバイルデバイスでスクロール可能である

### 要件8: パフォーマンス

**ユーザーストーリー:** プレイヤーとして、ノート編集・削除機能が素早く動作してほしい。そうすることで、ストレスなく利用できる。

#### 受け入れ基準

1. THE Note_Form SHALL 閲覧画面を即座に表示する
2. THE Note_Form SHALL 更新処理を2秒以内に完了する
3. THE Delete_Confirm_Dialog SHALL 削除処理を2秒以内に完了する
4. THE Note_Form SHALL 不要な再レンダリングを防ぐ

### 要件9: エラーハンドリング

**ユーザーストーリー:** プレイヤーとして、エラーが発生した場合に適切なメッセージを表示してほしい。そうすることで、問題を理解し対処できる。

#### 受け入れ基準

1. WHEN ネットワークエラーが発生した場合、THE Note_Form SHALL トースト通知で「ネットワークエラーが発生しました」と表示する
2. WHEN データベースエラーが発生した場合、THE Note_Form SHALL トースト通知で「更新に失敗しました」と表示する
3. WHEN 削除エラーが発生した場合、THE Delete_Confirm_Dialog SHALL トースト通知で「削除に失敗しました」と表示する
4. WHEN 認証エラーが発生した場合、THE Note_Form SHALL トースト通知で「ログインが必要です」と表示する
5. THE Note_Form SHALL トースト通知を3秒間表示する
6. THE Note_Form SHALL トースト通知を自動的に閉じる

## 技術的制約

- Next.js 15 (App Router)を使用
- TypeScript 5を使用
- React 19を使用
- Tailwind CSS 4を使用
- Supabase Clientを使用してデータベース操作
- Spec 2-2Aで実装したNoteFormコンポーネントを拡張

## 非機能要件

- 更新処理時間: 2秒以内
- 削除処理時間: 2秒以内
- モバイルデバイス（画面幅768px未満）でのレスポンシブ対応

## 依存関係

本Specは以下のSpecに依存します：

- **Spec 2-2A (matchup-notes-create)**: ノート一覧、NoteFormコンポーネント
- **Spec 3-1 (note-database-design)**: データベーススキーマ、RLSポリシー
- **Spec 1-1 (basic-ui-structure)**: 認証システム、ルートレイアウト
- **Spec 1-2 (common-components)**: Panel、GlobalLoading

## 実装範囲

本Specでは以下を実装します：

1. **ノート閲覧画面**: NoteForm（閲覧モード）
2. **ノート編集機能**: NoteForm（編集モード）
3. **ノート更新機能**: Supabase連携（UPDATE）
4. **ノート削除機能**: DeleteConfirmDialog
5. **削除処理**: Supabase連携（DELETE）
6. **一覧へ戻るボタン**: ナビゲーション機能

## 実装範囲外

以下の機能は本Specの範囲外とします：

- ノート検索・フィルタリング機能（将来実装）
- ノートのタグ付け機能（将来実装）
- ノート共有機能（将来実装）
- ノートのバージョン管理（将来実装）
