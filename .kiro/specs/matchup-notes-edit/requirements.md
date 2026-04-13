# 要件定義書: ノート編集・削除機能

## はじめに

本ドキュメントは、既存のチャンピオン対策ノートを閲覧・編集・削除する機能の要件を定義します。

本機能は、Spec 2-2A（matchup-notes-create）で実装したノート作成機能を拡張し、既存ノートの管理機能を提供します。

## 用語集

- **Note_Detail_View**: ノート詳細閲覧画面
- **Note_Edit_Mode**: ノート編集モード
- **Note_View_Mode**: ノート閲覧モード（読み取り専用）
- **Delete_Confirmation_Dialog**: 削除確認ダイアログ
- **Note_Form**: ノート入力フォーム（作成・編集共通）
- **Note_Card**: ノート一覧のカード表示
- **Toast_Notification**: トースト通知

## 要件

### 要件1: ノートカードのクリック機能

**ユーザーストーリー:** プレイヤーとして、ノート一覧からノートをクリックして詳細を表示したい。そうすることで、過去に作成した対策を確認できる。

#### 受け入れ基準

1. WHEN ノートカードをクリックする場合、THE Note_Card SHALL 詳細閲覧画面に遷移する
2. THE Note_Card SHALL クリック可能であることを視覚的に示す（ホバー効果）
3. THE Note_Card SHALL カーソルをポインターに変更する

### 要件2: 閲覧モードの表示

**ユーザーストーリー:** プレイヤーとして、ノートの内容を読み取り専用で確認したい。そうすることで、誤って編集することなく情報を参照できる。

#### 受け入れ基準

1. WHEN 閲覧モードの場合、THE Note_Detail_View SHALL 一覧へ戻るボタンを表示する
2. THE Note_Detail_View SHALL 左矢印アイコンと「一覧へ戻る」テキストを表示する
3. THE Note_Detail_View SHALL チャンピオンアイコンとマッチアップ情報を表示する
4. THE Note_Detail_View SHALL 編集ボタンを表示する
5. THE Note_Detail_View SHALL 削除ボタンを表示する
6. THE Note_Detail_View SHALL フォーム内容を読み取り専用で表示する
7. THE Note_Detail_View SHALL プリセット名を表示する
8. THE Note_Detail_View SHALL ルーン構成を表示する
9. THE Note_Detail_View SHALL サモナースペルを表示する
10. THE Note_Detail_View SHALL 初期アイテムを表示する
11. THE Note_Detail_View SHALL 対策メモを表示する

### 要件3: 編集モードへの遷移

**ユーザーストーリー:** プレイヤーとして、既存のノートを編集したい。そうすることで、戦略を改善・更新できる。

#### 受け入れ基準

1. WHEN 編集ボタンをクリックする場合、THE Note_Detail_View SHALL 編集モードに切り替わる
2. WHEN 編集モードに切り替わる場合、THE Note_Form SHALL 既存データを読み込む
3. WHEN 編集モードの場合、THE Note_Form SHALL 全ての入力欄を編集可能にする
4. WHEN 編集モードの場合、THE Note_Form SHALL 保存ボタンを表示する
5. WHEN 編集モードの場合、THE Note_Form SHALL キャンセルボタンを表示する

### 要件4: ノート更新機能

**ユーザーストーリー:** プレイヤーとして、編集した内容を保存したい。そうすることで、改善した戦略を記録できる。

#### 受け入れ基準

1. WHEN 保存ボタンをクリックする場合、THE Note_Form SHALL 入力内容を検証する
2. THE Note_Form SHALL プリセット名が100文字以内であることを検証する
3. THE Note_Form SHALL 対策メモが10,000文字以内であることを検証する
4. WHEN 入力内容が有効な場合、THE Note_Form SHALL Supabaseでノートを更新する
5. THE Note_Form SHALL 更新時にupdated_atを現在時刻に設定する
6. WHEN 更新が成功した場合、THE Note_Form SHALL トースト通知で成功メッセージを表示する
7. WHEN 更新が成功した場合、THE Note_Form SHALL 閲覧モードに戻る
8. WHEN 更新が失敗した場合、THE Note_Form SHALL トースト通知でエラーメッセージを表示する

### 要件5: 編集のキャンセル

**ユーザーストーリー:** プレイヤーとして、編集をキャンセルしたい。そうすることで、誤った変更を破棄できる。

#### 受け入れ基準

1. WHEN キャンセルボタンをクリックする場合、THE Note_Form SHALL 編集内容を破棄する
2. WHEN キャンセルボタンをクリックする場合、THE Note_Form SHALL 閲覧モードに戻る
3. THE Note_Form SHALL 元のデータを再表示する

### 要件6: 削除確認ダイアログ

**ユーザーストーリー:** プレイヤーとして、ノートを削除する前に確認したい。そうすることで、誤削除を防げる。

#### 受け入れ基準

1. WHEN 削除ボタンをクリックする場合、THE Note_Detail_View SHALL 削除確認ダイアログを表示する
2. THE Delete_Confirmation_Dialog SHALL 「このノートを削除しますか？」というメッセージを表示する
3. THE Delete_Confirmation_Dialog SHALL 「この操作は取り消せません」という警告を表示する
4. THE Delete_Confirmation_Dialog SHALL 削除ボタンを表示する
5. THE Delete_Confirmation_Dialog SHALL キャンセルボタンを表示する
6. THE Delete_Confirmation_Dialog SHALL 背景をオーバーレイで暗くする

### 要件7: ノート削除機能

**ユーザーストーリー:** プレイヤーとして、不要なノートを削除したい。そうすることで、ノート一覧を整理できる。

#### 受け入れ基準

1. WHEN 削除確認ダイアログで削除ボタンをクリックする場合、THE Note_Detail_View SHALL Supabaseからノートを削除する
2. WHEN 削除が成功した場合、THE Note_Detail_View SHALL トースト通知で成功メッセージを表示する
3. WHEN 削除が成功した場合、THE Note_Detail_View SHALL ノート一覧に戻る
4. WHEN 削除が失敗した場合、THE Note_Detail_View SHALL トースト通知でエラーメッセージを表示する
5. WHEN 削除が失敗した場合、THE Note_Detail_View SHALL ダイアログを閉じる

### 要件8: 一覧への戻り機能

**ユーザーストーリー:** プレイヤーとして、詳細画面から一覧に戻りたい。そうすることで、他のノートを確認できる。

#### 受け入れ基準

1. WHEN 一覧へ戻るボタンをクリックする場合、THE Note_Detail_View SHALL ノート一覧画面に遷移する
2. THE Note_Detail_View SHALL 編集中の内容を破棄する
3. THE Note_Detail_View SHALL 一覧画面で選択されていたチャンピオンを保持する

### 要件9: NoteFormのモード対応

**ユーザーストーリー:** 開発者として、NoteFormを作成・閲覧・編集の3モードで使用したい。そうすることで、コンポーネントを再利用できる。

#### 受け入れ基準

1. THE Note_Form SHALL mode prop（'create' | 'view' | 'edit'）を受け取る
2. WHEN mode='create'の場合、THE Note_Form SHALL 新規作成UIを表示する
3. WHEN mode='view'の場合、THE Note_Form SHALL 読み取り専用UIを表示する
4. WHEN mode='edit'の場合、THE Note_Form SHALL 編集可能UIを表示する
5. WHEN mode='view'の場合、THE Note_Form SHALL 入力欄を無効化する
6. WHEN mode='view'の場合、THE Note_Form SHALL 編集・削除ボタンを表示する

### 要件10: データ取得

**ユーザーストーリー:** プレイヤーとして、ノート詳細が素早く表示されてほしい。そうすることで、ストレスなく情報を確認できる。

#### 受け入れ基準

1. THE Note_Detail_View SHALL ノートIDでSupabaseからデータを取得する
2. THE Note_Detail_View SHALL ユーザーIDでフィルタリングする
3. WHEN データ取得中の場合、THE Note_Detail_View SHALL ローディング表示をする
4. WHEN データ取得が失敗した場合、THE Note_Detail_View SHALL エラーメッセージを表示する
5. THE Note_Detail_View SHALL データ取得を1秒以内に完了する

### 要件11: トースト通知

**ユーザーストーリー:** プレイヤーとして、操作結果を視覚的に確認したい。そうすることで、操作が成功したか失敗したかを理解できる。

#### 受け入れ基準

1. WHEN 更新が成功した場合、THE Toast_Notification SHALL 「ノートを更新しました」と表示する
2. WHEN 更新が失敗した場合、THE Toast_Notification SHALL 「ノートの更新に失敗しました」と表示する
3. WHEN 削除が成功した場合、THE Toast_Notification SHALL 「ノートを削除しました」と表示する
4. WHEN 削除が失敗した場合、THE Toast_Notification SHALL 「ノートの削除に失敗しました」と表示する
5. THE Toast_Notification SHALL 3秒間表示する
6. THE Toast_Notification SHALL 自動的に閉じる

### 要件12: ページ状態管理

**ユーザーストーリー:** 開発者として、一覧・閲覧・編集の状態を適切に管理したい。そうすることで、スムーズな画面遷移を実現できる。

#### 受け入れ基準

1. THE Notes_Page SHALL 表示状態（'list' | 'view' | 'edit'）を管理する
2. THE Notes_Page SHALL 選択されたノートIDを管理する
3. WHEN 状態が'list'の場合、THE Notes_Page SHALL ノート一覧を表示する
4. WHEN 状態が'view'の場合、THE Notes_Page SHALL 閲覧モードを表示する
5. WHEN 状態が'edit'の場合、THE Notes_Page SHALL 編集モードを表示する

### 要件13: レスポンシブデザイン

**ユーザーストーリー:** プレイヤーとして、モバイルデバイスでもノート編集機能を快適に使用したい。そうすることで、どのデバイスからでもアクセスできる。

#### 受け入れ基準

1. WHEN 画面幅が768px未満の場合、THE Note_Detail_View SHALL 1カラムレイアウトで表示する
2. THE Delete_Confirmation_Dialog SHALL モバイルデバイスで適切なサイズで表示される
3. THE Note_Form SHALL モバイルデバイスで適切に表示される

### 要件14: パフォーマンス

**ユーザーストーリー:** プレイヤーとして、ノート編集機能が素早く動作してほしい。そうすることで、ストレスなく利用できる。

#### 受け入れ基準

1. THE Note_Detail_View SHALL ノート詳細を1秒以内に表示する
2. THE Note_Form SHALL 更新処理を2秒以内に完了する
3. THE Note_Detail_View SHALL 削除処理を2秒以内に完了する
4. THE Note_Detail_View SHALL 不要な再レンダリングを防ぐ

### 要件15: エラーハンドリング

**ユーザーストーリー:** プレイヤーとして、エラーが発生した場合に適切なメッセージを表示してほしい。そうすることで、問題を理解し対処できる。

#### 受け入れ基準

1. WHEN ネットワークエラーが発生した場合、THE Note_Detail_View SHALL トースト通知で「ネットワークエラーが発生しました」と表示する
2. WHEN データベースエラーが発生した場合、THE Note_Detail_View SHALL トースト通知で「操作に失敗しました」と表示する
3. WHEN 認証エラーが発生した場合、THE Note_Detail_View SHALL トースト通知で「ログインが必要です」と表示する
4. WHEN ノートが見つからない場合、THE Note_Detail_View SHALL 「ノートが見つかりません」と表示する

## 技術的制約

- Next.js 15 (App Router)を使用
- TypeScript 5を使用
- React 19を使用
- Tailwind CSS 4を使用
- Supabase Clientを使用してデータベース操作
- Spec 2-1の左サイドバー（ChampionSelectorSidebar）を再利用
- Spec 2-2AのNoteForm、NoteList、NoteCardを拡張
- Spec 3-1のデータベーススキーマ（champion_notesテーブル）を使用

## 非機能要件

- ノート詳細表示時間: 1秒以内
- 更新処理時間: 2秒以内
- 削除処理時間: 2秒以内
- モバイルデバイス（画面幅768px未満）でのレスポンシブ対応

## 依存関係

本Specは以下のSpecに依存します：

- **Spec 2-1 (champion-note-basic)**: タブナビゲーション、左サイドバー
- **Spec 2-2A (matchup-notes-create)**: NoteList, NoteCard, NoteForm
- **Spec 3-1 (note-database-design)**: データベーススキーマ、RLSポリシー
- **Spec 1-1 (basic-ui-structure)**: 認証システム、ルートレイアウト
- **Spec 1-2 (common-components)**: Panel、GlobalLoading

## 実装範囲

本Specでは以下を実装します：

1. **NoteCardのクリックイベント**: ノート詳細への遷移
2. **NoteFormのモード拡張**: mode prop（'create' | 'view' | 'edit'）対応
3. **閲覧モードUI**: 読み取り専用表示、編集・削除ボタン
4. **編集モードUI**: 編集可能フォーム、保存・キャンセルボタン
5. **削除確認ダイアログ**: DeleteConfirmationDialog コンポーネント
6. **Supabase API拡張**: updateNote, deleteNote 関数
7. **ページ状態管理**: 一覧 ⇔ 閲覧 ⇔ 編集の状態管理
8. **トースト通知**: 更新・削除の成功・失敗メッセージ

## 実装範囲外

以下の機能は本Specの範囲外とし、将来実装します：

- ノート検索・フィルタリング機能
- ノートのタグ付け機能
- ノート共有機能
- ノートのバージョン管理
- ノートの複製機能
