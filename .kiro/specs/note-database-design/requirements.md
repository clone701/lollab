# 要件定義書: ノートデータベース設計

## はじめに

本ドキュメントは、LoL Labのノート機能におけるデータベース設計の要件を定義します。現在の`champion_notes`テーブルを拡張し、汎用ノートと対策ノートの両方をサポートする柔軟なDB構造を実現します。

## 用語集

- **Note_System**: ノート管理システム全体
- **Champion_Note**: チャンピオン関連のノート（汎用・対策の両方を含む）
- **General_Note**: 汎用ノート（特定のマッチアップに依存しない一般的なメモ・戦略）
- **Matchup_Note**: 対策ノート（特定のマッチアップに対する詳細な対策情報）
- **Note_Type**: ノートの種類を識別する列挙型（general, matchup）
- **User**: 認証済みユーザー（app_usersテーブル）
- **Champion_ID**: チャンピオンを識別する文字列（例: "Ahri", "Yasuo"）
- **Rune_Config**: ルーン構成を表すJSON形式のデータ
- **Summoner_Spell**: サモナースペルを表す文字列配列（例: ["SummonerFlash", "SummonerIgnite"]）
- **Item_Build**: アイテムビルドを表す文字列配列（例: ["1055", "2003"]）
- **Supabase**: PostgreSQLベースのBaaSプラットフォーム
- **JSONB**: PostgreSQLのJSON Binary型（柔軟なデータ構造の保存に使用）

## 要件

### 要件1: ノートタイプの識別

**ユーザーストーリー:** 開発者として、汎用ノートと対策ノートを明確に区別したい。そうすることで、適切なUIとバリデーションを提供できる。

#### 受け入れ基準

1. THE Champion_Note SHALL ノートタイプを識別するnote_type列を持つ
2. THE note_type列 SHALL 'general'または'matchup'の値のみを許可する
3. WHEN note_typeが'general'の場合、THE Champion_Note SHALL enemy_champion_idをNULLとして保存する
4. WHEN note_typeが'matchup'の場合、THE Champion_Note SHALL enemy_champion_idを必須とする

### 要件2: 汎用ノートのデータ構造

**ユーザーストーリー:** プレイヤーとして、特定のチャンピオンに関する一般的な戦略やメモを記録したい。そうすることで、そのチャンピオンを使用する際の基本的な知識を蓄積できる。

#### 受け入れ基準

1. WHEN note_typeが'general'の場合、THE Champion_Note SHALL my_champion_idを必須とする
2. WHEN note_typeが'general'の場合、THE Champion_Note SHALL enemy_champion_idをNULLとして保存する
3. THE General_Note SHALL ルーン構成（runes）をJSONB形式で保存できる
4. THE General_Note SHALL サモナースペル（spells）をJSONB形式で保存できる
5. THE General_Note SHALL アイテムビルド（items）をJSONB形式で保存できる
6. THE General_Note SHALL 自由形式のメモ（memo）をテキスト形式で保存できる

### 要件3: 対策ノートのデータ構造

**ユーザーストーリー:** プレイヤーとして、特定のマッチアップに対する詳細な対策情報を記録したい。そうすることで、同じマッチアップに再度遭遇した際に効果的な戦略を素早く参照できる。

#### 受け入れ基準

1. WHEN note_typeが'matchup'の場合、THE Champion_Note SHALL my_champion_idを必須とする
2. WHEN note_typeが'matchup'の場合、THE Champion_Note SHALL enemy_champion_idを必須とする
3. THE Matchup_Note SHALL ルーン構成（runes）をJSONB形式で保存できる
4. THE Matchup_Note SHALL サモナースペル（spells）をJSONB形式で保存できる
5. THE Matchup_Note SHALL アイテムビルド（items）をJSONB形式で保存できる
6. THE Matchup_Note SHALL 対策メモ（memo）をテキスト形式で保存できる

### 要件4: ユーザーデータの分離

**ユーザーストーリー:** プレイヤーとして、自分のノートが他のユーザーから見えないようにしたい。そうすることで、プライバシーが保護され、安心してノートを作成できる。

#### 受け入れ基準

1. THE Champion_Note SHALL user_id列を持つ
2. THE user_id列 SHALL app_users.idへの外部キー制約を持つ
3. WHEN ノートを作成する場合、THE Note_System SHALL 認証済みユーザーのIDをuser_idに設定する
4. WHEN ノートを取得する場合、THE Note_System SHALL 現在のユーザーのIDでフィルタリングする

### 要件5: データの整合性とバリデーション

**ユーザーストーリー:** 開発者として、データベースレベルでデータの整合性を保証したい。そうすることで、不正なデータの保存を防ぎ、アプリケーションの信頼性を向上できる。

#### 受け入れ基準

1. THE Champion_Note SHALL id列を主キーとして持つ
2. THE id列 SHALL 自動採番される
3. THE my_champion_id列 SHALL NOT NULL制約を持つ
4. WHEN note_typeが'matchup'の場合、THE Champion_Note SHALL enemy_champion_idがNULLでないことを検証する
5. THE Champion_Note SHALL created_at列とupdated_at列を持つ
6. WHEN ノートを作成する場合、THE Note_System SHALL created_atに現在時刻を設定する
7. WHEN ノートを更新する場合、THE Note_System SHALL updated_atに現在時刻を設定する

### 要件6: 検索パフォーマンスの最適化

**ユーザーストーリー:** プレイヤーとして、大量のノートを作成しても素早く検索できるようにしたい。そうすることで、必要な情報を即座に見つけることができる。

#### 受け入れ基準

1. THE Champion_Note SHALL user_id列にインデックスを持つ
2. THE Champion_Note SHALL my_champion_id列にインデックスを持つ
3. THE Champion_Note SHALL enemy_champion_id列にインデックスを持つ
4. THE Champion_Note SHALL note_type列にインデックスを持つ
5. WHEN ユーザーが自分のノートを検索する場合、THE Note_System SHALL インデックスを使用して200ms以内に結果を返す

### 要件7: JSONデータ構造の定義

**ユーザーストーリー:** 開発者として、ルーン・スペル・アイテムのJSON構造を明確に定義したい。そうすることで、フロントエンドとバックエンドで一貫したデータ形式を使用できる。

#### 受け入れ基準

1. THE Rune_Config SHALL primaryPath（メインルーンパスID）を含む
2. THE Rune_Config SHALL secondaryPath（サブルーンパスID）を含む
3. THE Rune_Config SHALL keystone（キーストーンルーンID）を含む
4. THE Rune_Config SHALL primaryRunes（メインルーン配列）を含む
5. THE Rune_Config SHALL secondaryRunes（サブルーン配列）を含む
6. THE Rune_Config SHALL shards（シャード配列）を含む
7. THE Summoner_Spell SHALL 2つの文字列要素を持つ配列である
8. THE Item_Build SHALL 文字列要素の配列である

### 要件8: 既存データとの互換性

**ユーザーストーリー:** 開発者として、既存の`champion_notes`テーブルのデータを新しい構造に移行したい。そうすることで、既存ユーザーのデータを失うことなく新機能を提供できる。

#### 受け入れ基準

1. THE Note_System SHALL 既存のchampion_notesテーブル構造を拡張する
2. WHEN 既存のノートが存在する場合、THE Note_System SHALL それらをnote_type='matchup'として扱う
3. THE Note_System SHALL 既存のカラム（id, user_id, my_champion_id, enemy_champion_id, runes, spells, items, memo, created_at, updated_at）を保持する
4. THE Note_System SHALL note_type列を新規追加する

### 要件9: マイグレーション戦略

**ユーザーストーリー:** 開発者として、安全にデータベーススキーマを更新したい。そうすることで、ダウンタイムなしで新機能をデプロイできる。

#### 受け入れ基準

1. THE Note_System SHALL note_type列をデフォルト値'matchup'で追加する
2. WHEN note_type列を追加する場合、THE Note_System SHALL 既存のレコードに'matchup'を設定する
3. THE Note_System SHALL CHECK制約を追加してnote_typeの値を検証する
4. THE Note_System SHALL 必要なインデックスを作成する
5. WHEN マイグレーションが失敗した場合、THE Note_System SHALL ロールバック可能である

### 要件10: Supabase Row Level Security (RLS)

**ユーザーストーリー:** プレイヤーとして、自分のノートが確実に保護されていることを知りたい。そうすることで、安心してアプリケーションを使用できる。

#### 受け入れ基準

1. THE Champion_Note SHALL Row Level Security (RLS)を有効にする
2. THE Note_System SHALL ユーザーが自分のノートのみを読み取れるポリシーを持つ
3. THE Note_System SHALL ユーザーが自分のノートのみを作成できるポリシーを持つ
4. THE Note_System SHALL ユーザーが自分のノートのみを更新できるポリシーを持つ
5. THE Note_System SHALL ユーザーが自分のノートのみを削除できるポリシーを持つ
6. WHEN 認証されていないユーザーがアクセスする場合、THE Note_System SHALL すべての操作を拒否する

## データ構造例

### 汎用ノートの例
```json
{
  "id": 1,
  "user_id": "uuid-here",
  "note_type": "general",
  "my_champion_id": "Ahri",
  "enemy_champion_id": null,
  "runes": {
    "primaryPath": 8100,
    "secondaryPath": 8200,
    "keystone": 8112,
    "primaryRunes": [8126, 8138, 8135],
    "secondaryRunes": [9111, 9104],
    "shards": [5008, 5008, 5002]
  },
  "spells": ["SummonerFlash", "SummonerIgnite"],
  "items": ["1055", "2003"],
  "memo": "基本的なビルドとプレイスタイル",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### 対策ノートの例
```json
{
  "id": 2,
  "user_id": "uuid-here",
  "note_type": "matchup",
  "my_champion_id": "Ahri",
  "enemy_champion_id": "Yasuo",
  "runes": {
    "primaryPath": 8100,
    "secondaryPath": 8300,
    "keystone": 8112,
    "primaryRunes": [8126, 8138, 8135],
    "secondaryRunes": [8304, 8345],
    "shards": [5008, 5008, 5002]
  },
  "spells": ["SummonerFlash", "SummonerExhaust"],
  "items": ["1056", "2003"],
  "memo": "Yasuoのウィンドウォールに注意。Eでハラスしてから距離を取る。",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

## 技術的制約

- PostgreSQL 14以上（Supabaseの標準バージョン）
- JSONB型のサポート必須
- Row Level Security (RLS)のサポート必須
- インデックス作成によるパフォーマンス最適化

## 非機能要件

- 検索クエリは200ms以内に応答する
- 1ユーザーあたり最大1000ノートをサポート
- JSONBデータは最大10KBまで
- データベース接続はSupabase Clientを使用
