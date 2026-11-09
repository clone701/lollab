# リポジトリ構造定義

```
lollab/
├── .github/workflows/ci.yml        # テストと main のデプロイ（CodeBuild の起動）
├── .kiro/
│   ├── specs/                      # Spec定義ファイル
│   └── steering/                   # ステアリングファイル
├── docs/
│   └── architecture.md             # 構成図・運用手順（人向け）
├── buildspec.yml                   # CodeBuild のビルドとデプロイ
├── infra/
│   ├── bootstrap.yaml              # 初回に手動でデプロイ（OIDC、CodeBuild、ロール）
│   ├── app.yaml                    # アプリのリソース（S3、CloudFront、Lambda）
│   ├── functions/                  # CloudFront Function（gate.js）とテスト
│   └── scripts/                    # デプロイ用の補助スクリプト
├── supabase/migrations/            # DB マイグレーション（YYYYMMDDHHmmss_説明.sql）
├── frontend/
│   ├── src/
│   │   ├── app/                    # App Router（ルーティングのみ）
│   │   ├── adapters/               # 外部サービス腐敗防止層（Supabase, Riot API等）
│   │   ├── components/             # UIコンポーネント（Specで作成）
│   │   ├── lib/                    # 内部ユーティリティ（hooks, contexts, utils, api）
│   │   └── types/                  # TypeScript型定義（Specで作成）
│   └── public/images/              # 静的画像・ゲームデータ（下記）
└── backend/
    ├── api/
    │   ├── deps/                   # 共通の依存関数（認証など）
    │   └── {feature}/              # 機能ごとのサブディレクトリ
    ├── services/
    │   └── {feature}/              # 機能ごとのサブディレクトリ
    ├── adapters/                   # 外部サービス腐敗防止層
    ├── lambda_handlers/            # Lambda のハンドラー（api, backfill）
    ├── schemas/                    # Pydanticスキーマ
    ├── scripts/                    # 手動で実行する運用スクリプト
    ├── utils/                      # 汎用ユーティリティ
    ├── config.py                   # 設定管理（保持）
    ├── requirements.txt            # 依存関係（保持）
    └── requirements-lambda.txt     # Lambda の ZIP に入れる依存関係
```

## `frontend/public/images/` のゲームデータ

パッチの更新を上書きコピーだけで済ませるため、新しく足すものはダウンロード元と同じフォルダ構成にし、ファイルは加工しない。

| ダウンロード元 | 置き場所 |
|---|---|
| `D:\dev\img\<フォルダ>` | `public/images/<フォルダ>` |
| Data Dragon の版のフォルダ（例: `D:\dev\16.21.1`）の `css`・`data`・`img` | `public/images/css`・`data`・`img` |

- 今ある `public/images/data/ja_JP/`（item・runesReforged・summoner・champion）と `img/spell`・`img/passive` は 16.21.1（game-data-tooltip）
- 既存の `champion`・`item`・`runes`・`summonerSpells` などはこの決まりより前に置いたもので、今は動かさない
