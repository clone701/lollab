# リポジトリ構造定義

```
lollab/
├── .kiro/
│   ├── specs/                      # Spec定義ファイル
│   └── steering/                   # ステアリングファイル
├── docs/                           # プロジェクトドキュメント
├── frontend/
│   ├── src/
│   │   ├── app/                    # App Router（ルーティングのみ）
│   │   ├── adapters/               # 外部サービス腐敗防止層（Supabase, Riot API等）
│   │   ├── components/             # UIコンポーネント（Specで作成）
│   │   ├── lib/                    # 内部ユーティリティ（hooks, contexts, utils）
│   │   └── types/                  # TypeScript型定義（Specで作成）
│   └── public/images/              # 静的画像
└── backend/
    ├── api/
    │   └── {feature}/              # 機能ごとのサブディレクトリ
    ├── services/
    │   └── {feature}/              # 機能ごとのサブディレクトリ
    ├── adapters/                   # 外部サービス腐敗防止層
    ├── schemas/                    # Pydanticスキーマ
    ├── utils/                      # 汎用ユーティリティ
    ├── config.py                   # 設定管理（保持）
    └── requirements.txt            # 依存関係（保持）
```
