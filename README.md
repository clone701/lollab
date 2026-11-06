# LoL Lab

League of Legendsプレイヤー向けの戦略ノート管理アプリケーション

## ディレクトリ構成

```
lollab/
  frontend/   ← Next.js（静的書き出し → S3 + CloudFront）
  backend/    ← FastAPI（AWS Lambda）
  infra/      ← CloudFormation テンプレートと CloudFront Function
  supabase/   ← DB マイグレーション
  docs/       ← ドキュメント
```

構成図・デプロイ・運用手順は [docs/architecture.md](docs/architecture.md) を参照。

## 開発ワークフロー

```bash
# 新機能開発
git switch develop
git pull
git switch -c feature/my-feature

# 開発後、PR作成
git push -u origin feature/my-feature
# GitHub で feature/my-feature → develop のPRを作成（マージ後にブランチは自動で削除される）

# リリース（developが安定したら）
# GitHub で develop → main のPRを作成（マージで AWS に自動デプロイ）
```

## ブランチ

- `main`: 本番環境（マージで AWS に自動デプロイ）
- `develop`: 統合ブランチ
- `feature/*`・`fix/*`・`chore/*`: 作業ブランチ
