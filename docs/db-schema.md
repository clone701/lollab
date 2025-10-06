# DBスキーマ設計

本ドキュメントは LoL Lab のデータベース設計についてまとめたものです。  
主に Supabase（PostgreSQL）を前提としています。

---

## 1. 認証・ユーザー情報

### app_users（Google認証ユーザー管理用・独自テーブル）

Google認証で得たユーザー情報を管理する独自テーブル例。

| カラム名      | 型      | 説明                          |
| ------------- | ------- | ----------------------------- |
| id            | uuid    | ユーザーID（PK, 自動生成可）  |
| email         | text    | メールアドレス                |
| name          | text    | 表示名                        |
| image         | text    | アイコンURL                   |
| provider      | text    | 認証プロバイダー名（例: google）|
| provider_id   | text    | プロバイダー側のID（Google sub等）|
| created_at    | timestamp | 作成日時                    |

> NextAuth.jsのGoogle認証後、FastAPI経由でこのテーブルにINSERT/UPSERTする運用を想定。

---

### profiles（任意）

- ユーザーの追加プロフィール情報を保存する場合

| カラム名      | 型         | 説明                |
| ------------- | ---------- | ------------------- |
| id            | uuid       | PK, app_users.idと同じ  |
| display_name  | text       | 表示名（任意）      |
| icon_url      | text       | アイコンURL（任意） |
| created_at    | timestamp  | 作成日時            |

---

## 2. チャンピオン対策ノート

### champion_notes

| カラム名            | 型         | 説明                          |
| ------------------- | ---------- | ----------------------------- |
| id                  | bigint     | PK, 自動採番                  |
| user_id             | uuid       | FK, app_users.id              |
| my_champion_id      | text       | 自分のチャンピオンID          |
| enemy_champion_id   | text       | 相手のチャンピオンID          |
| runes               | jsonb      | ルーン構成（JSON）            |
| spells              | jsonb      | サモナースペル（配列JSON）    |
| items               | jsonb      | 初期アイテム（配列JSON）      |
| memo                | text       | 対策メモ                      |
| created_at          | timestamp  | 作成日時                      |
| updated_at          | timestamp  | 更新日時                      |

#### 例: runes/spells/items のJSONイメージ

```json
{
  "primaryPath": 8100,
  "secondaryPath": 8200,
  "keystone": 8112,
  "primaryRunes": [8126, 8138, 8135, 8000],
  "secondaryRunes": [9111, 9104],
  "shards": [5008, 5008, 5002]
}
```

```json
["SummonerFlash", "SummonerIgnite"]
```

```json
["1055", "2003"]
```

---

## 3. ER図イメージ

```
app_users ---< champion_notes
      |
  profiles (option)
```

---

## 4. インデックス・設計メモ

- `champion_notes.user_id` にインデックス推奨（ユーザーごとの検索高速化）
- `my_champion_id`, `enemy_champion_id` も検索用途でインデックス検討
- ルーン・スペル・アイテムは柔軟性重視で `jsonb` 型

---

## 5. 今後の拡張案

- ノートのタグ付け・公開/非公開フラグ
- ノートのバージョン管理
- チャンピオン名やアイコンは外部API参照（冗長化しない）

---

## 6. 参考

- [Supabase ドキュメント](https://supabase.com/docs)
- [PostgreSQL JSONB 型](https://www.postgresql.jp/document/14/html/datatype-json.html)
