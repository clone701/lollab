# 要件定義書: ノート一覧・作成機能

## はじめに

本ドキュメントは、チャンピオン対策ノートの一覧表示と新規作成機能の要件を定義します。

本機能は、Spec 2-1で実装した基本レイアウトとチャンピオン選択UIを活用し、ノートの作成と一覧表示機能を提供します。

**編集・削除機能はSpec 2-2Bで実装します。**

## 用語集

- **Matchup_Note**: チャンピオン対策ノート（特定のマッチアップに対する詳細な対策情報）
- **Note_Form**: ノート作成フォーム
- **Note_List**: ノート一覧表示
- **Note_Card**: 個別ノートのカード表示
- **Rune_Selector**: ルーン選択UI
- **Summoner_Spell_Picker**: サモナースペル選択UI
- **Item_Build_Selector**: アイテムビルド選択UI
- **Primary_Rune**: メインルーン（キーストーン + 3つのルーン）
- **Secondary_Rune**: サブルーン（2つのルーン）
- **Stat_Shard**: ステータスシャード（3つ: Offense, Flex, Defense）
- **Supabase_Client**: Supabaseデータベースクライアント
- **Toast**: トースト通知コンポーネント

## 要件

### 要件1: ノート一覧表示

**ユーザーストーリー:** プレイヤーとして、選択したチャンピオンペアの既存ノートを一覧表示したい。そうすることで、過去に作成した対策を素早く確認できる。

#### 受け入れ基準

1. WHEN 自分と相手のチャンピオンが両方選択されている場合、THE Note_List SHALL 該当するノートを一覧表示する
2. THE Note_List SHALL ノートをカード形式で表示する
3. THE Note_Card SHALL プリセット名を表示する
4. THE Note_Card SHALL チャンピオンアイコンを表示する
5. THE Note_Card SHALL 作成日時を表示する
6. THE Note_Card SHALL 更新日時を表示する
7. WHEN ノートが存在しない場合、THE Note_List SHALL 「ノートがありません」というメッセージを表示する
8. THE Note_List SHALL 現在のユーザーのノートのみを表示する

### 要件2: 新規ノート作成フォーム表示

**ユーザーストーリー:** プレイヤーとして、新しい対策ノートを作成したい。そうすることで、学んだ戦略を記録できる。

#### 受け入れ基準

1. WHEN 自分と相手のチャンピオンが両方選択されている場合、THE Note_Form SHALL 「新規ノート作成」ボタンを表示する
2. WHEN 「新規ノート作成」ボタンをクリックする場合、THE Note_Form SHALL 作成フォームを表示する
3. WHEN 新規作成モードの場合、THE Note_Form SHALL プリセット名入力欄を表示する
4. WHEN 新規作成モードの場合、THE Note_Form SHALL 「保存」ボタンのみを表示する
5. THE Note_Form SHALL ルーン選択UIを表示する
6. THE Note_Form SHALL サモナースペル選択UIを表示する
7. THE Note_Form SHALL 初期アイテム選択UIを表示する
8. THE Note_Form SHALL 対策メモ入力欄を表示する
9. THE Note_Form SHALL 「キャンセル」ボタンを表示する

### 要件3: ルーン選択機能

**ユーザーストーリー:** プレイヤーとして、マッチアップに適したルーン構成を選択したい。そうすることで、効果的なビルドを記録できる。

#### 受け入れ基準

1. THE Rune_Selector SHALL メインルーンパスを選択できる
2. THE Rune_Selector SHALL サブルーンパスを選択できる
3. WHEN メインルーンパスを選択する場合、THE Rune_Selector SHALL キーストーンルーンを4つから1つ選択できる
4. THE Rune_Selector SHALL メインルーンを3段階（各段階3つから1つ）選択できる
5. WHEN サブルーンパスを選択する場合、THE Rune_Selector SHALL サブルーンを2つ選択できる
6. THE Rune_Selector SHALL ステータスシャードを3段階（各段階3つから1つ）選択できる
7. THE Rune_Selector SHALL 選択されたルーンを視覚的にハイライト表示する
8. THE Rune_Selector SHALL ルーンアイコンを表示する

### 要件4: サモナースペル選択機能

**ユーザーストーリー:** プレイヤーとして、マッチアップに適したサモナースペルを選択したい。そうすることで、戦略的なスペル選択を記録できる。

#### 受け入れ基準

1. THE Summoner_Spell_Picker SHALL 2つのサモナースペルを選択できる
2. THE Summoner_Spell_Picker SHALL 利用可能な全サモナースペルを表示する
3. THE Summoner_Spell_Picker SHALL サモナースペルアイコンを表示する
4. THE Summoner_Spell_Picker SHALL 選択されたスペルを視覚的にハイライト表示する
5. WHEN 既に2つのスペルが選択されている場合、THE Summoner_Spell_Picker SHALL 新しいスペルをクリックすると最初のスペルを置き換える

### 要件5: 初期アイテム選択機能

**ユーザーストーリー:** プレイヤーとして、マッチアップに適した初期アイテムを選択したい。そうすることで、効果的なスタートアイテムを記録できる。

#### 受け入れ基準

1. THE Item_Build_Selector SHALL 複数の初期アイテムを選択できる
2. THE Item_Build_Selector SHALL スターターアイテムを表示する
3. THE Item_Build_Selector SHALL アイテムアイコンを表示する
4. THE Item_Build_Selector SHALL 選択されたアイテムを視覚的にハイライト表示する
5. THE Item_Build_Selector SHALL アイテムの選択を解除できる

### 要件6: ノート保存機能

**ユーザーストーリー:** プレイヤーとして、作成したノートを保存したい。そうすることで、後で参照できる。

#### 受け入れ基準

1. WHEN 「保存」ボタンをクリックする場合、THE Note_Form SHALL 入力内容を検証する
2. THE Note_Form SHALL プリセット名が入力されていることを検証する
3. WHEN 入力内容が有効な場合、THE Note_Form SHALL Supabaseにノートを保存する
4. THE Note_Form SHALL 保存時に現在のユーザーIDを設定する
5. THE Note_Form SHALL 保存時に選択されたチャンピオンIDを設定する
6. THE Note_Form SHALL 保存時にルーン構成をJSONB形式で保存する
7. THE Note_Form SHALL 保存時にサモナースペルをJSONB形式で保存する
8. THE Note_Form SHALL 保存時に初期アイテムをJSONB形式で保存する
9. WHEN 保存が成功した場合、THE Note_Form SHALL トースト通知で成功メッセージを表示する
10. WHEN 保存が成功した場合、THE Note_Form SHALL ノート一覧を更新する
11. WHEN 保存が失敗した場合、THE Note_Form SHALL トースト通知でエラーメッセージを表示する

### 要件7: チャンピオン選択との連携

**ユーザーストーリー:** プレイヤーとして、チャンピオンを選択すると自動的にノート一覧が更新されてほしい。そうすることで、スムーズにノートを管理できる。

#### 受け入れ基準

1. WHEN 自分のチャンピオンを選択する場合、THE Note_List SHALL 一覧を更新する
2. WHEN 相手のチャンピオンを選択する場合、THE Note_List SHALL 一覧を更新する
3. WHEN 両方のチャンピオンが選択されている場合、THE Note_List SHALL 該当するノートを表示する
4. WHEN チャンピオン選択をリセットする場合、THE Note_List SHALL 空の状態を表示する
5. THE Note_List SHALL チャンピオン選択の変更に即座に反応する

### 要件8: データ取得とキャッシング

**ユーザーストーリー:** プレイヤーとして、ノート一覧が素早く表示されてほしい。そうすることで、ストレスなくノートを参照できる。

#### 受け入れ基準

1. THE Note_List SHALL Supabase Clientを使用してノートを取得する
2. THE Note_List SHALL ユーザーIDでフィルタリングする
3. THE Note_List SHALL 自分のチャンピオンIDでフィルタリングする
4. THE Note_List SHALL 相手のチャンピオンIDでフィルタリングする
5. THE Note_List SHALL ノートを更新日時の降順で表示する
6. WHEN データ取得中の場合、THE Note_List SHALL ローディング表示をする
7. WHEN データ取得が失敗した場合、THE Note_List SHALL エラーメッセージを表示する
8. THE Note_List SHALL データ取得を1秒以内に完了する

### 要件9: フォームバリデーション

**ユーザーストーリー:** プレイヤーとして、無効なデータを保存できないようにしたい。そうすることで、データの整合性が保たれる。

#### 受け入れ基準

1. THE Note_Form SHALL プリセット名が空でないことを検証する
2. THE Note_Form SHALL プリセット名が100文字以内であることを検証する
3. THE Note_Form SHALL 対策メモが10,000文字以内であることを検証する
4. WHEN バリデーションエラーがある場合、THE Note_Form SHALL エラーメッセージを表示する
5. WHEN バリデーションエラーがある場合、THE Note_Form SHALL 保存を実行しない
6. THE Note_Form SHALL エラーメッセージを該当する入力欄の近くに表示する

### 要件10: UI/UXフロー

**ユーザーストーリー:** プレイヤーとして、直感的にノートを管理したい。そうすることで、学習に集中できる。

#### 受け入れ基準

1. WHEN チャンピオンが選択されていない場合、THE Note_List SHALL 「チャンピオンを選択してください」というメッセージを表示する
2. WHEN ノートが存在しない場合、THE Note_List SHALL 「新規ノート作成」ボタンを強調表示する
3. WHEN ノートが存在する場合、THE Note_List SHALL ノート一覧と「新規ノート作成」ボタンを表示する
4. WHEN フォームを表示している場合、THE Note_Form SHALL 「キャンセル」ボタンでノート一覧に戻る
5. THE Note_Form SHALL 保存成功後にノート一覧に戻る
6. THE Note_Form SHALL 編集中のデータを保持する

### 要件11: レスポンシブデザイン

**ユーザーストーリー:** プレイヤーとして、モバイルデバイスでもノート機能を快適に使用したい。そうすることで、どのデバイスからでもアクセスできる。

#### 受け入れ基準

1. WHEN 画面幅が768px未満の場合、THE Note_Form SHALL 1カラムレイアウトで表示する
2. THE Note_Card SHALL モバイルデバイスで適切なサイズで表示される
3. THE Rune_Selector SHALL モバイルデバイスでスクロール可能である
4. THE Summoner_Spell_Picker SHALL モバイルデバイスで適切なサイズで表示される
5. THE Item_Build_Selector SHALL モバイルデバイスでスクロール可能である

### 要件12: パフォーマンス

**ユーザーストーリー:** プレイヤーとして、ノート機能が素早く動作してほしい。そうすることで、ストレスなく利用できる。

#### 受け入れ基準

1. THE Note_List SHALL ノート一覧を1秒以内に表示する
2. THE Note_Form SHALL フォームを即座に表示する
3. THE Note_Form SHALL 保存処理を2秒以内に完了する
4. THE Note_List SHALL 不要な再レンダリングを防ぐ

### 要件13: エラーハンドリング

**ユーザーストーリー:** プレイヤーとして、エラーが発生した場合に適切なメッセージを表示してほしい。そうすることで、問題を理解し対処できる。

#### 受け入れ基準

1. WHEN ネットワークエラーが発生した場合、THE Note_Form SHALL トースト通知で「ネットワークエラーが発生しました」と表示する
2. WHEN データベースエラーが発生した場合、THE Note_Form SHALL トースト通知で「保存に失敗しました」と表示する
3. WHEN 認証エラーが発生した場合、THE Note_Form SHALL トースト通知で「ログインが必要です」と表示する
4. THE Note_Form SHALL トースト通知を3秒間表示する
5. THE Note_Form SHALL トースト通知を自動的に閉じる

## 技術的制約

- Next.js 15 (App Router)を使用
- TypeScript 5を使用
- React 19を使用
- Tailwind CSS 4を使用
- Supabase Clientを使用してデータベース操作
- Spec 2-1の左サイドバー（ChampionSelectorSidebar）を再利用
- Spec 3-1のデータベーススキーマ（champion_notesテーブル）を使用

## 非機能要件

- ノート一覧表示時間: 1秒以内
- 保存処理時間: 2秒以内
- 1ユーザーあたり最大1,000ノート対応
- JSONBデータは最大10KB
- モバイルデバイス（画面幅768px未満）でのレスポンシブ対応

## 依存関係

本Specは以下のSpecに依存します：

- **Spec 2-1 (champion-note-basic)**: タブナビゲーション、左サイドバー、チャンピオン選択UI
- **Spec 3-1 (note-database-design)**: データベーススキーマ、RLSポリシー
- **Spec 1-1 (basic-ui-structure)**: 認証システム、ルートレイアウト
- **Spec 1-2 (common-components)**: Panel、GlobalLoading

## 実装範囲

本Specでは以下を実装します：

1. **ノート一覧表示**: NoteList, NoteCard
2. **新規ノート作成フォーム**: NoteForm
3. **ルーン選択UI**: RuneSelector
4. **サモナースペル選択UI**: SummonerSpellPicker
5. **初期アイテム選択UI**: ItemBuildSelector
6. **トースト通知**: Toast
7. **Supabase連携**: API関数（notes.ts - 作成・一覧取得）
8. **データ定義**: ルーンデータ、サモナースペルデータ、アイテムデータ

## 実装範囲外

以下の機能は本Specの範囲外とし、Spec 2-2Bまたは将来実装します：

- **Spec 2-2Bで実装**: ノート編集機能、ノート削除機能
- **将来実装**: ノート検索・フィルタリング機能、ノートのタグ付け機能、ノート共有機能、ノートのバージョン管理
