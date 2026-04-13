# Git ワークフロー

## ブランチ戦略

```
main (本番環境)
  ↑
develop (統合ブランチ)
  ↑
feature/* (機能開発)
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

## ブランチ命名規則

- **feature/**: 新機能 (例: `feature/user-profile`)
- **fix/**: バグ修正 (例: `fix/login-error`)
- **hotfix/**: 緊急修正 (例: `hotfix/security-patch`)

## コミットメッセージ規約

```
feat: 新機能
fix: バグ修正
docs: ドキュメント
style: フォーマット
refactor: リファクタリング
test: テスト
chore: その他
```

## デプロイ

- **本番デプロイ**: `main`へのpush時に自動デプロイ（Vercel/Render）
- **プレビュー**: なし（無料枠のため）

## 注意事項

- `main`への直接pushは禁止
- `develop`への直接pushも推奨しない（PR経由）
- pre-pushフックでlint/type-checkが自動実行される
