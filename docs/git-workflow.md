# Git ワークフロー

## ブランチ戦略

```
main (本番環境 - Vercel/Render自動デプロイ)
  ↑
develop (統合ブランチ)
  ↑
feature/* (機能開発)
fix/* (バグ修正)
hotfix/* (緊急修正)
```

## ブランチ命名規則

### feature/* - 新機能開発
```bash
feature/user-authentication
feature/summoner-search
feature/champion-notes
feature/lollab-123  # Issue番号付き
```

### fix/* - バグ修正
```bash
fix/summoner-search-timeout
fix/note-validation-error
fix/lollab-456  # Issue番号付き
```

### hotfix/* - 緊急修正（本番の重大なバグ）
```bash
hotfix/critical-security-patch
hotfix/api-rate-limit-fix
```

## 開発フロー

### 1. 新機能開発

```bash
# developから新しいfeatureブランチを作成
git checkout develop
git pull origin develop
git checkout -b feature/new-feature

# 開発・コミット
git add .
git commit -m "feat: 新機能を追加"

# pushしてPR作成（feature → develop）
git push origin feature/new-feature
```

### 2. developへのマージ

- GitHubでPR作成: `feature/new-feature` → `develop`
- pre-pushフックで自動チェック（lint + type-check）
- レビュー・承認
- マージ後、featureブランチは削除

### 3. 本番リリース

```bash
# developが安定したらmainにマージ
git checkout main
git pull origin main
git merge develop
git push origin main
```

または、GitHubでPR作成: `develop` → `main`

### 4. ホットフィックス（緊急修正）

```bash
# mainから直接ホットフィックスブランチを作成
git checkout main
git checkout -b hotfix/critical-bug

# 修正・コミット
git add .
git commit -m "fix: 緊急バグ修正"

# mainとdevelopの両方にマージ
git checkout main
git merge hotfix/critical-bug
git push origin main

git checkout develop
git merge hotfix/critical-bug
git push origin develop

# ホットフィックスブランチ削除
git branch -d hotfix/critical-bug
```

## コミットメッセージ規約

### 形式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type（必須）

- **feat**: 新機能
- **fix**: バグ修正
- **docs**: ドキュメントのみの変更
- **style**: コードの意味に影響しない変更（フォーマット、セミコロン等）
- **refactor**: リファクタリング
- **perf**: パフォーマンス改善
- **test**: テストの追加・修正
- **chore**: ビルドプロセスやツールの変更

### 例

```bash
feat(auth): Google OAuth認証を追加

- NextAuth.js設定を実装
- Googleプロバイダーをセットアップ
- ログイン/ログアウトUIを追加

Closes #123

fix(api): サモナー検索のタイムアウトを修正

Riot APIクライアントがタイムアウトエラーを
適切に処理していなかった問題を修正

- 全APIリクエストに5秒のタイムアウトを追加
- タイムアウト時のエラーハンドリングを実装
- 指数バックオフによるリトライロジックを追加

Fixes #456

docs(readme): インストール手順を更新

- Node.jsバージョン要件を追加
- 環境変数セットアップ手順を追加
- トラブルシューティングセクションを追加

chore(deps): 依存関係を最新版に更新

- Next.js 15.5.9に更新
- React 19.1.0に更新
- TypeScript 5.9.3に更新
```

## プルリクエスト規約

### PRテンプレート

```markdown
## 概要
<!-- 変更内容の簡潔な説明 -->

## 変更内容
- [ ] 新機能の追加
- [ ] バグ修正
- [ ] リファクタリング
- [ ] ドキュメント更新
- [ ] テスト追加

## テスト
- [ ] ユニットテスト追加・更新
- [ ] 手動テスト実行
- [ ] pre-pushフック通過（lint + type-check）

## スクリーンショット
<!-- UI変更がある場合 -->

## チェックリスト
- [ ] コードレビュー完了
- [ ] テストが全て通過
- [ ] ドキュメント更新
- [ ] 破壊的変更の確認

## 関連Issue
Closes #123
```

### レビュー基準

- [ ] 機能要件を満たしているか
- [ ] コーディング規約に従っているか
- [ ] エラーハンドリングが適切か
- [ ] テストが追加されているか
- [ ] パフォーマンスへの影響がないか
- [ ] セキュリティ上の問題がないか

## デプロイ

### 自動デプロイ

- **本番デプロイ**: `main`へのpush時に自動デプロイ（Vercel/Render）
- **プレビュー**: なし（無料枠のため）

### デプロイフロー

```
feature → develop (PR) → main (PR) → 自動デプロイ
```

## Git Hooks

### pre-push（自動実行）

```bash
# .husky/pre-push
cd frontend
npm run lint        # ESLintチェック
npm run type-check  # TypeScript型チェック
```

エラーがあればpushが中断されます。

## 注意事項

- `main`への直接pushは禁止
- `develop`への直接pushも推奨しない（PR経由）
- pre-pushフックでlint/type-checkが自動実行される
- コミット前に必ずローカルでテストを実行
- 大きな変更は小さなコミットに分割

