# 要件定義書: 汎用ノート作成機能

## はじめに

本ドキュメントは、LoL Labアプリの「汎用ノート」タブに追加する、チャンピオンに紐付かない自由なメモ作成機能の要件を定義します。

ユーザーは任意のタイトル・本文・タグを持つノートを作成・管理できます。

## 用語集

- **General_Note**: 汎用ノート（チャンピオンに紐付かない自由なメモ）
- **Note_List**: ノート一覧表示エリア（左カラム）
- **Note_Card**: 一覧内の個別ノートカード
- **Note_Detail**: ノート詳細表示エリア（右カラム）
- **Note_Form**: ノート作成フォーム
- **Tag**: ノートに付与できる自由入力のラベル
- **Tag_Input**: タグ入力UI
- **Char_Counter**: 本文リアルタイム文字数カウンター
- **Supabase_Client**: Supabaseデータベースクライアント
- **Toast**: トースト通知コンポーネント
- **Markdown_Renderer**: マークダウンをHTMLにレンダリングするコンポーネント（`react-markdown`使用）
- **Champion_Mention**: 本文中の `/チャンピオンID` パターンをチャンピオン画像に変換するカスタムレンダラー

## 要件

### 要件1: ノート一覧表示

**ユーザーストーリー:** プレイヤーとして、作成した汎用ノートの一覧を確認したい。そうすることで、過去のメモを素早く参照できる。

#### 受け入れ基準

1. THE Note_List SHALL 現在のユーザーの汎用ノートを一覧表示する
2. THE Note_Card SHALL タイトルを表示する
3. THE Note_Card SHALL 本文の先頭100文字をプレビューとして表示する
4. THE Note_Card SHALL タグを表示する
5. THE Note_Card SHALL 作成日時を表示する
6. THE Note_Card SHALL 更新日時を表示する
7. WHEN ノートが存在しない場合、THE Note_List SHALL 「ノートがありません」というメッセージを表示する
8. THE Note_List SHALL ノートを更新日時の降順で表示する

### 要件2: ノート閲覧画面

**ユーザーストーリー:** プレイヤーとして、選択したノートの内容を閲覧したい。そうすることで、過去のメモを参照できる。

#### 受け入れ基準

1. WHEN ノートが選択された場合、THE Note_Detail SHALL 選択されたノートの詳細を表示する
2. THE Note_Detail SHALL タイトルを表示する
3. THE Note_Detail SHALL 本文をマークダウンレンダリングして表示する
4. THE Note_Detail SHALL 下部にタグ一覧を表示する
5. THE Note_Detail SHALL 右上に更新日時を表示する
6. THE Note_Detail SHALL 右上に「編集」ボタンを表示する
7. THE Note_Detail SHALL 右上に「削除」ボタンを表示する
8. WHEN ノートが選択されていない場合、THE Note_Detail SHALL プレースホルダーメッセージを表示する

### 要件3: マークダウンレンダリング

**ユーザーストーリー:** プレイヤーとして、本文をマークダウン記法で書いて見やすく表示したい。そうすることで、構造化されたメモを作成できる。

#### 受け入れ基準

1. THE Markdown_Renderer SHALL 閲覧モードで本文をマークダウンとしてレンダリングする
2. THE Markdown_Renderer SHALL 見出し（`##`）、リスト（`-`）、太字（`**`）を適切にレンダリングする
3. THE Markdown_Renderer SHALL 編集モードではプレーンテキストとして表示する

### 要件4: チャンピオンメンション

**ユーザーストーリー:** プレイヤーとして、本文中に `/チャンピオンID` と書くとチャンピオン画像が表示されてほしい。そうすることで、視覚的にわかりやすいメモを作成できる。

#### 受け入れ基準

1. WHEN 閲覧モードで本文中に `/チャンピオンID`（例: `/yasuo`）が含まれる場合、THE Champion_Mention SHALL 該当箇所をチャンピオンのアイコン画像に置き換えて表示する
2. THE Champion_Mention SHALL チャンピオン画像の後にチャンピオン名を表示する
3. WHEN チャンピオンIDが存在しない場合、THE Champion_Mention SHALL テキストをそのまま表示する
4. THE Champion_Mention SHALL 編集モードでは `/チャンピオンID` をプレーンテキストとして表示する
5. THE Champion_Mention SHALL `/チャンピオンID` の後に続くテキスト（例: `に気を付ける`）をそのまま表示する

### 要件5: 新規ノート作成フォーム

**ユーザーストーリー:** プレイヤーとして、新しい汎用ノートを作成したい。そうすることで、チャンピオンに依存しない自由なメモを記録できる。

#### 受け入れ基準

1. THE Note_Form SHALL 右上に「新規作成」ボタンを表示する
2. WHEN 「新規作成」ボタンをクリックする場合、THE Note_Form SHALL 作成フォームを表示する
3. THE Note_Form SHALL タイトル入力欄を表示する
4. THE Note_Form SHALL 本文入力欄を表示する
5. THE Note_Form SHALL Tag_Input を表示する
6. THE Note_Form SHALL 「保存」ボタンを表示する
7. THE Note_Form SHALL 「キャンセル」ボタンを表示する

### 要件6: タグ入力機能

**ユーザーストーリー:** プレイヤーとして、ノートに自由なタグを付与したい。そうすることで、ノートを分類・整理できる。

#### 受け入れ基準

1. WHEN タグ入力欄にテキストを入力してEnterキーを押す場合、THE Tag_Input SHALL タグを追加する
2. WHEN タグの×ボタンをクリックする場合、THE Tag_Input SHALL 該当タグを削除する
3. THE Tag_Input SHALL 1ノートあたり最大10タグまで追加できる
4. THE Tag_Input SHALL 1タグあたり20文字以内であることを検証する
5. WHEN タグ数が10に達した場合、THE Tag_Input SHALL タグ入力欄を非活性化する
6. WHEN タグが20文字を超える場合、THE Tag_Input SHALL エラーメッセージを表示する

### 要件7: 本文文字数カウント

**ユーザーストーリー:** プレイヤーとして、本文の文字数をリアルタイムで確認したい。そうすることで、入力量を把握しながらメモを記述できる。

#### 受け入れ基準

1. THE Char_Counter SHALL 本文入力欄の文字数をリアルタイムで表示する
2. THE Char_Counter SHALL 現在の文字数と上限文字数を「現在数/上限数」の形式で表示する

### 要件8: ノート保存機能

**ユーザーストーリー:** プレイヤーとして、作成したノートを保存したい。そうすることで、後で参照できる。

#### 受け入れ基準

1. WHEN 「保存」ボタンをクリックする場合、THE Note_Form SHALL 入力内容を検証する
2. THE Note_Form SHALL タイトルが入力されていることを検証する
3. WHEN 入力内容が有効な場合、THE Note_Form SHALL Supabase_Client を使用してノートを保存する
4. THE Note_Form SHALL 保存時に現在のユーザーIDを設定する
5. WHEN 保存が成功した場合、THE Note_Form SHALL Toast で成功メッセージを表示する
6. WHEN 保存が成功した場合、THE Note_Form SHALL Note_List を更新する
7. WHEN 保存が成功した場合、THE Note_Form SHALL フォームを閉じてノート一覧に戻る
8. WHEN 保存が失敗した場合、THE Note_Form SHALL Toast でエラーメッセージを表示する

### 要件9: フォームバリデーション

**ユーザーストーリー:** プレイヤーとして、無効なデータを保存できないようにしたい。そうすることで、データの整合性が保たれる。

#### 受け入れ基準

1. THE Note_Form SHALL タイトルが100文字以内であることを検証する
2. THE Note_Form SHALL 本文が10,000文字以内であることを検証する
3. WHEN バリデーションエラーがある場合、THE Note_Form SHALL エラーメッセージを該当入力欄の近くに表示する
4. WHEN バリデーションエラーがある場合、THE Note_Form SHALL 保存を実行しない

### 要件10: データ取得

**ユーザーストーリー:** プレイヤーとして、ノート一覧が素早く表示されてほしい。そうすることで、ストレスなくノートを参照できる。

#### 受け入れ基準

1. THE Note_List SHALL Supabase_Client を使用してノートを取得する
2. THE Note_List SHALL ユーザーIDでフィルタリングする
3. WHEN データ取得中の場合、THE Note_List SHALL ローディング表示をする
4. WHEN データ取得が失敗した場合、THE Note_List SHALL エラーメッセージを表示する
5. THE Note_List SHALL データ取得を1秒以内に完了する

### 要件11: エラーハンドリング

**ユーザーストーリー:** プレイヤーとして、エラーが発生した場合に適切なメッセージを表示してほしい。そうすることで、問題を理解し対処できる。

#### 受け入れ基準

1. WHEN ネットワークエラーが発生した場合、THE Note_Form SHALL Toast で「ネットワークエラーが発生しました」と表示する
2. WHEN データベースエラーが発生した場合、THE Note_Form SHALL Toast で「保存に失敗しました」と表示する
3. WHEN 認証エラーが発生した場合、THE Note_Form SHALL Toast で「ログインが必要です」と表示する
4. THE Toast SHALL 3秒後に自動的に閉じる

### 要件12: 認証・データ分離

**ユーザーストーリー:** プレイヤーとして、自分のノートのみが表示されることを保証してほしい。そうすることで、プライバシーが守られる。

#### 受け入れ基準

1. THE Note_List SHALL 認証済みユーザーのノートのみを表示する
2. THE Supabase_Client SHALL RLSポリシーによりユーザー固有データを分離する
3. WHEN 未認証ユーザーがアクセスする場合、THE Note_Form SHALL 保存操作を拒否する

## 技術的制約

- Next.js 15 (App Router) を使用
- TypeScript 5 を使用
- Tailwind CSS 4 を使用
- Supabase Auth（RLSポリシー）でユーザー固有データを分離
- FE-coding-guidelines.md に従い、1ファイル60行以内・Public APIパターンを遵守
- 外部サービス操作は `adapters/` 経由のみ
- マークダウンレンダリングに `react-markdown` を使用
- チャンピオン画像は `/public/images/champion/{championId}.png` を使用

## 非機能要件

- ノート一覧表示時間: 1秒以内
- 保存処理時間: 2秒以内
- 1ユーザーあたり最大1,000ノート対応
- タグ: 1ノートあたり最大10個、1タグ最大20文字
- 本文: 最大10,000文字
- タイトル: 最大100文字

## 依存関係

- **matchup-notes-create**: 対策ノートの新規作成UIパターンを参考にする
- **note-database-design**: Supabase接続・RLSポリシーのパターンを参考にする
