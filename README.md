# LoL Lab

League of Legendsプレイヤー向けの戦略ノート管理アプリケーション

## ディレクトリ構成

```
lollab/
  frontend/   ← Next.js (Vercel)
  backend/    ← FastAPI (Render)
    ├── main.py
    ├── requirements.txt
    └── (他: app/ など)
  docs/       ← ドキュメント
```

## 開発ワークフロー

詳細は [docs/git-workflow.md](docs/git-workflow.md) を参照

### クイックスタート

```bash
# 新機能開発
git checkout develop
git checkout -b feature/my-feature

# 開発後、PR作成
git push origin feature/my-feature
# GitHub で feature/my-feature → develop のPRを作成

# リリース（developが安定したら）
# GitHub で develop → main のPRを作成
```

## ブランチ

- `main`: 本番環境（自動デプロイ）
- `develop`: 統合ブランチ
- `feature/*`: 機能開発ブランチ
