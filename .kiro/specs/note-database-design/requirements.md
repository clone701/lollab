# 要件定義書: ノートデータベース設計

## はじめに

本ドキュメントは、LoL Labのノート機能におけるデータベース設計の要件を定義します。現在の`champion_notes`テーブルを拡張し、汎用ノートと対策ノートの両方をサポートする柔軟なDB構造を実現します。

## 用語集

- **Note_System**: ノート管理システム全体
- **General_Note**: 汎用ノート（チャンピオンに紐付かない自由なメモ）
- **Matchup_Note**: 対策ノート（特定のマッチアップに対する詳細な対策情報）
- **User**: 認証済みユーザー（app_usersテーブル）
- **Champion_ID**: チャンピオンを識別する文字列（例: "Ahri", "Yasuo"）
- **Rune_Config**: ルーン構成を表すJSON形式のデータ
- **Summoner_Spell**: サモナースペルを表す文字列配列（例: ["SummonerFlash", "SummonerIgnite"]）
- **Item_Build**: アイテムビルドを表す文字列配列（例: ["1055", "2003"]）
- **Supabase**: PostgreSQLベースのBaaSプラットフォーム
- **JSONB**: PostgreSQLのJSON Binary型（柔軟なデータ構造の保存に使用）

## 要件

### 要件1: テーブル分離設計

**ユーザーストーリー:** 開発者として、汎用ノートと対策ノートを別テーブルで管理したい。そうすることで、それぞれの関心事を明確に分離し、スキーマをシンプルに保てる。

#### 受け入れ基準

1. THE Note_System SHALL 汎用ノートを `general_notes` テーブルで管理する
2. THE Note_System SHALL 対策ノートを `champion_notes` テーブルで管理する
3. THE general_notes テーブル SHALL `champion_notes` テーブルと独立したスキーマを持つ

### 要件2: 汎用ノートのデータ構造

**ユーザーストーリー:** プレイヤーとして、チャンピオンに紐付かない自由なメモを記録したい。そうすることで、ゲーム全般の学びや戦略を蓄積できる。

#### 受け入れ基準

1. THE General_Note SHALL タイトル（title）を必須で保存できる
2. THE General_Note SHALL 本文（body）をテキスト形式で保存できる
3. THE General_Note SHALL タグ（tags）をtext[]配列形式で保存できる
4. THE tags SHALL 最大10個まで保存できる
5. THE General_Note SHALL created_at・updated_at を持つ

### 要件3: 対策ノートのデータ構造（既存）

**ユーザーストーリー:** プレイヤーとして、特定のマッチアップに対する詳細な対策情報を記録したい。そうすることで、同じマッチアップに再度遭遇した際に効果的な戦略を素早く参照できる。

#### 受け入れ基準

1. THE Matchup_Note SHALL my_champion_id・enemy_champion_id を必須で保存できる
2. THE Matchup_Note SHALL ルーン構成（runes）をJSONB形式で保存できる
3. THE Matchup_Note SHALL サモナースペル（spells）をJSONB形式で保存できる
4. THE Matchup_Note SHALL アイテムビルド（items）をJSONB形式で保存できる
5. THE Matchup_Note SHALL 対策メモ（memo）をテキスト形式で保存できる

### 要件4: ユーザーデータの分離

**ユーザーストーリー:** プレイヤーとして、自分のノートが他のユーザーから見えないようにしたい。そうすることで、プライバシーが保護され、安心してノートを作成できる。

#### 受け入れ基準

1. THE general_notes SHALL user_id列を持つ
2. THE user_id列 SHALL app_users.idへの外部キー制約を持つ
3. WHEN ユーザーが削除された場合、THE Note_System SHALL そのユーザーのgeneral_notesをCASCADE削除する
4. WHEN ノートを取得する場合、THE Note_System SHALL 現在のユーザーのIDでフィルタリングする

### 要件5: データの整合性とバリデーション

**ユーザーストーリー:** 開発者として、データベースレベルでデータの整合性を保証したい。そうすることで、不正なデータの保存を防ぎ、アプリケーションの信頼性を向上できる。

#### 受け入れ基準

1. THE general_notes SHALL id列を主キーとして持つ
2. THE id列 SHALL 自動採番される
3. THE title列 SHALL NOT NULL制約を持つ
4. THE tags列 SHALL `array_length(tags, 1) <= 10` のCHECK制約を持つ
5. THE general_notes SHALL created_at・updated_at列を持つ
6. WHEN ノートを作成する場合、THE Note_System SHALL created_atに現在時刻を設定する
7. WHEN ノートを更新する場合、THE Note_System SHALL updated_atに現在時刻を設定する

### 要件6: 検索パフォーマンスの最適化

**ユーザーストーリー:** プレイヤーとして、大量のノートを作成しても素早く検索できるようにしたい。そうすることで、必要な情報を即座に見つけることができる。

#### 受け入れ基準

1. THE general_notes SHALL `(user_id, updated_at DESC)` の複合インデックスを持つ
2. THE general_notes SHALL tagsにGINインデックスを持つ
3. WHEN ユーザーが自分のノート一覧を取得する場合、THE Note_System SHALL インデックスを使用して200ms以内に結果を返す

### 要件7: JSONデータ構造の定義（対策ノート用）

**ユーザーストーリー:** 開発者として、ルーン・スペル・アイテムのJSON構造を明確に定義したい。そうすることで、フロントエンドとバックエンドで一貫したデータ形式を使用できる。

#### 受け入れ基準

1. THE Rune_Config SHALL primaryPath・secondaryPath・keystone・primaryRunes・secondaryRunes・shardsを含む
2. THE Summoner_Spell SHALL 2つの文字列要素を持つ配列である
3. THE Item_Build SHALL 文字列要素の配列である

### 要件8: Supabase Row Level Security (RLS)

**ユーザーストーリー:** プレイヤーとして、自分のノートが確実に保護されていることを知りたい。そうすることで、安心してアプリケーションを使用できる。

#### 受け入れ基準

1. THE general_notes SHALL Row Level Security (RLS)を有効にする
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
  "title": "ランクマッチ学習メモ",
  "body": "## 序盤\n- ウェーブクリアを優先\n\n## 学びまとめ\n- /yasuo のウィンドウォールに注意",
  "tags": ["ウェーブ", "ローム"],
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### 対策ノートの例
```json
{
  "id": 2,
  "user_id": "uuid-here",
  "my_champion_id": "Ahri",
  "enemy_champion_id": "Yasuo",
  "preset_name": "序盤安定型",
  "runes": { "primaryPath": 8100, "secondaryPath": 8300, "keystone": 8112, "primaryRunes": [8126, 8138, 8135], "secondaryRunes": [8304, 8345], "shards": [5008, 5008, 5002] },
  "spells": ["SummonerFlash", "SummonerExhaust"],
  "items": ["1056", "2003"],
  "memo": "Yasuoのウィンドウォールに注意。Eでハラスしてから距離を取る。",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

## 技術的制約

- PostgreSQL 14以上（Supabaseの標準バージョン）
- JSONB型のサポート必須（champion_notes用）
- text[]型のサポート必須（general_notes.tags用）
- Row Level Security (RLS)のサポート必須
- インデックス作成によるパフォーマンス最適化

## 非機能要件

- 検索クエリは200ms以内に応答する
- 1ユーザーあたり最大1,000ノートをサポート
- JSONBデータは最大10KBまで（champion_notes）
- タグ: 最大10個、各20文字以内（general_notes）
- データベース接続はSupabase Clientを使用
