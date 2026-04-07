# RLS（Row Level Security）動作テストガイド

## 概要

このドキュメントは、Supabaseのマイグレーション実行後にRow Level Security (RLS)ポリシーが正しく動作することを確認するためのテスト手順を説明します。

## RLSポリシーの概要

### app_users テーブル

| 操作 | ポリシー名 | 条件 |
|------|-----------|------|
| SELECT | Users can view their own profile | `auth.uid() = id` |
| UPDATE | Users can update their own profile | `auth.uid() = id` |

### profiles テーブル

| 操作 | ポリシー名 | 条件 |
|------|-----------|------|
| SELECT | Users can view their own profile | `auth.uid() = id` |
| INSERT | Users can create their own profile | `auth.uid() = id` |
| UPDATE | Users can update their own profile | `auth.uid() = id` |
| DELETE | Users can delete their own profile | `auth.uid() = id` |

### champion_notes テーブル

| 操作 | ポリシー名 | 条件 |
|------|-----------|------|
| SELECT | Users can view their own notes | `auth.uid() = user_id` |
| INSERT | Users can create their own notes | `auth.uid() = user_id` |
| UPDATE | Users can update their own notes | `auth.uid() = user_id` |
| DELETE | Users can delete their own notes | `auth.uid() = user_id` |

## テスト準備

### 1. テストユーザーの作成

Supabase Dashboardで2つのテストユーザーを作成します。

1. **Supabase Dashboard** → **Authentication** → **Users** を開く
2. 「Add user」をクリック
3. 以下の情報でユーザーを作成：

**ユーザーA:**
- Email: `test-user-a@example.com`
- Password: `TestPassword123!`
- Auto Confirm User: チェック

**ユーザーB:**
- Email: `test-user-b@example.com`
- Password: `TestPassword123!`
- Auto Confirm User: チェック

### 2. ユーザーIDの確認

作成したユーザーのIDをメモします。

```sql
-- Supabase Dashboard の SQL Editor で実行
SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 2;
```

出力例:
```
id                                   | email
-------------------------------------+---------------------------
550e8400-e29b-41d4-a716-446655440000 | test-user-a@example.com
550e8400-e29b-41d4-a716-446655440001 | test-user-b@example.com
```

## RLSテスト手順

### テスト1: app_users テーブルのRLS

#### 1.1 テストデータの挿入

```sql
-- サービスキーを使用してテストデータを挿入
-- Supabase Dashboard の SQL Editor で実行

INSERT INTO app_users (id, email, name, provider, provider_id)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440000', 'test-user-a@example.com', 'Test User A', 'google', 'google-id-a'),
  ('550e8400-e29b-41d4-a716-446655440001', 'test-user-b@example.com', 'Test User B', 'google', 'google-id-b');
```

#### 1.2 RLSポリシーのテスト

**期待される動作:**
- ユーザーAは自分のデータのみ読み取り・更新可能
- ユーザーBは自分のデータのみ読み取り・更新可能
- 他のユーザーのデータは読み取り・更新不可

**テスト方法:**

アプリケーション（Next.js）から以下のコードを実行してテストします。

```typescript
// ユーザーAでログイン後
const { data: userData, error } = await supabase
  .from('app_users')
  .select('*');

console.log('User A can see:', userData);
// 期待: ユーザーAのデータのみ表示される（1件）
```

### テスト2: champion_notes テーブルのRLS

#### 2.1 テストデータの挿入

```sql
-- サービスキーを使用してテストデータを挿入
-- Supabase Dashboard の SQL Editor で実行

INSERT INTO champion_notes (user_id, note_type, my_champion_id, enemy_champion_id, memo)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440000', 'matchup', 'Ahri', 'Yasuo', 'User A note 1'),
  ('550e8400-e29b-41d4-a716-446655440000', 'general', 'Ahri', NULL, 'User A note 2'),
  ('550e8400-e29b-41d4-a716-446655440001', 'matchup', 'Zed', 'Yasuo', 'User B note 1');
```

#### 2.2 SELECT ポリシーのテスト

**期待される動作:**
- ユーザーAは自分のノート（2件）のみ読み取り可能
- ユーザーBは自分のノート（1件）のみ読み取り可能

**テスト方法:**

```typescript
// ユーザーAでログイン後
const { data: notesA, error } = await supabase
  .from('champion_notes')
  .select('*');

console.log('User A can see:', notesA?.length, 'notes');
// 期待: 2件のノートが表示される

// ユーザーBでログイン後
const { data: notesB, error } = await supabase
  .from('champion_notes')
  .select('*');

console.log('User B can see:', notesB?.length, 'notes');
// 期待: 1件のノートが表示される
```

#### 2.3 INSERT ポリシーのテスト

**期待される動作:**
- ユーザーは自分のuser_idでのみノートを作成可能
- 他のユーザーのuser_idでノートを作成しようとするとエラー

**テスト方法:**

```typescript
// ユーザーAでログイン後

// 成功するケース: 自分のuser_idで作成
const { data: success, error: successError } = await supabase
  .from('champion_notes')
  .insert({
    user_id: 'ユーザーAのID',
    note_type: 'general',
    my_champion_id: 'Lux',
    memo: 'Test note'
  });

console.log('Insert with own user_id:', successError ? 'Failed' : 'Success');
// 期待: Success

// 失敗するケース: 他のユーザーのuser_idで作成
const { data: fail, error: failError } = await supabase
  .from('champion_notes')
  .insert({
    user_id: 'ユーザーBのID',
    note_type: 'general',
    my_champion_id: 'Lux',
    memo: 'Test note'
  });

console.log('Insert with other user_id:', failError ? 'Failed (Expected)' : 'Success (Unexpected)');
// 期待: Failed (Expected)
```

#### 2.4 UPDATE ポリシーのテスト

**期待される動作:**
- ユーザーは自分のノートのみ更新可能
- 他のユーザーのノートは更新不可

**テスト方法:**

```typescript
// ユーザーAでログイン後

// 成功するケース: 自分のノートを更新
const { data: ownNote } = await supabase
  .from('champion_notes')
  .select('id')
  .eq('user_id', 'ユーザーAのID')
  .limit(1)
  .single();

const { error: updateOwnError } = await supabase
  .from('champion_notes')
  .update({ memo: 'Updated memo' })
  .eq('id', ownNote.id);

console.log('Update own note:', updateOwnError ? 'Failed' : 'Success');
// 期待: Success

// 失敗するケース: 他のユーザーのノートを更新
const { data: otherNote } = await supabase
  .from('champion_notes')
  .select('id')
  .eq('user_id', 'ユーザーBのID')
  .limit(1)
  .single();

const { error: updateOtherError } = await supabase
  .from('champion_notes')
  .update({ memo: 'Hacked!' })
  .eq('id', otherNote.id);

console.log('Update other note:', updateOtherError ? 'Failed (Expected)' : 'Success (Unexpected)');
// 期待: Failed (Expected)
```

#### 2.5 DELETE ポリシーのテスト

**期待される動作:**
- ユーザーは自分のノートのみ削除可能
- 他のユーザーのノートは削除不可

**テスト方法:**

```typescript
// ユーザーAでログイン後

// 成功するケース: 自分のノートを削除
const { data: ownNote } = await supabase
  .from('champion_notes')
  .select('id')
  .eq('user_id', 'ユーザーAのID')
  .limit(1)
  .single();

const { error: deleteOwnError } = await supabase
  .from('champion_notes')
  .delete()
  .eq('id', ownNote.id);

console.log('Delete own note:', deleteOwnError ? 'Failed' : 'Success');
// 期待: Success

// 失敗するケース: 他のユーザーのノートを削除
const { data: otherNote } = await supabase
  .from('champion_notes')
  .select('id')
  .eq('user_id', 'ユーザーBのID')
  .limit(1)
  .single();

const { error: deleteOtherError } = await supabase
  .from('champion_notes')
  .delete()
  .eq('id', otherNote.id);

console.log('Delete other note:', deleteOtherError ? 'Failed (Expected)' : 'Success (Unexpected)');
// 期待: Failed (Expected)
```

### テスト3: 未認証ユーザーのアクセス

**期待される動作:**
- 未認証ユーザーはすべての操作が拒否される

**テスト方法:**

```typescript
// ログアウト状態で実行

const { data, error } = await supabase
  .from('champion_notes')
  .select('*');

console.log('Unauthenticated access:', error ? 'Blocked (Expected)' : 'Allowed (Unexpected)');
// 期待: Blocked (Expected)
```

## SQL Editorでの直接テスト

アプリケーションを使用せずに、SQL Editorで直接RLSをテストすることもできます。

### サービスキーでのテスト（RLS無効）

```sql
-- サービスキーを使用する場合、RLSはバイパスされる
-- すべてのデータが表示される
SELECT * FROM champion_notes;
```

### anonキーでのテスト（RLS有効）

Supabase Clientを使用する場合、anonキーが使用され、RLSが適用されます。
アプリケーションからのテストが推奨されます。

## テスト結果の記録

以下のチェックリストを使用して、テスト結果を記録してください。

### app_users テーブル

- [ ] ユーザーは自分のプロフィールを読み取れる
- [ ] ユーザーは他のユーザーのプロフィールを読み取れない
- [ ] ユーザーは自分のプロフィールを更新できる
- [ ] ユーザーは他のユーザーのプロフィールを更新できない

### champion_notes テーブル

- [ ] ユーザーは自分のノートのみ読み取れる
- [ ] ユーザーは他のユーザーのノートを読み取れない
- [ ] ユーザーは自分のuser_idでノートを作成できる
- [ ] ユーザーは他のユーザーのuser_idでノートを作成できない
- [ ] ユーザーは自分のノートを更新できる
- [ ] ユーザーは他のユーザーのノートを更新できない
- [ ] ユーザーは自分のノートを削除できる
- [ ] ユーザーは他のユーザーのノートを削除できない

### 未認証ユーザー

- [ ] 未認証ユーザーはすべての操作が拒否される

## トラブルシューティング

### RLSポリシーが機能しない

**原因:** RLSが有効化されていない

**確認方法:**
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

**解決方法:**
```sql
ALTER TABLE champion_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

### auth.uid()がNULLを返す

**原因:** 認証トークンが正しく渡されていない

**確認方法:**
- Supabase Clientが正しく初期化されているか確認
- ログイン状態を確認
- セッションが有効か確認

**解決方法:**
```typescript
// セッションの確認
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);
```

### ポリシーが予期しない動作をする

**原因:** ポリシーの条件が間違っている

**確認方法:**
```sql
-- ポリシーの詳細を確認
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

**解決方法:**
- ポリシーを削除して再作成
- マイグレーションスクリプトを再実行

## 次のステップ

RLSテストが成功したら、以下を実行してください：

1. **アプリケーション統合テスト**
   - フロントエンドからの実際の操作をテスト
   - エラーハンドリングの確認

2. **パフォーマンステスト**
   - 大量のデータでのクエリ性能確認
   - インデックスの効果確認

3. **セキュリティ監査**
   - すべてのエンドポイントでRLSが適用されているか確認
   - 権限昇格の可能性がないか確認

## 参考資料

- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers)
