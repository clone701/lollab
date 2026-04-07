# リポジトリ構造定義

## 概要

このドキュメントはLoL Labプロジェクトのディレクトリ構造、ファイル配置ルール、命名規則を定義します。

## プロジェクト構造

```
lollab/
├── .kiro/                          # Kiro設定
│   ├── specs/                      # Spec定義ファイル
│   └── steering/                   # ステアリングファイル
│       ├── tech.md                 # 技術スタック定義
│       ├── product.md              # プロダクト定義
│       ├── structure.md            # リポジトリ構造定義
│       ├── coding-rules.md         # 共通コーディング規約
│       ├── frontend-coding-guidelines.md  # フロントエンド規約
│       └── backend-coding-guidelines.md   # バックエンド規約
├── docs/                           # プロジェクトドキュメント
│   ├── product-requirements.md     # プロダクト要求定義書
│   ├── functional-design.md        # 機能設計書
│   ├── architecture.md             # 技術仕様書
│   ├── repository-structure.md     # リポジトリ構造定義書
│   ├── development-guidelines.md   # 開発ガイドライン
│   ├── db-schema.md                # データベーススキーマ
│   ├── glossary.md                 # ユビキタス言語定義
│   └── ai-coding-workflow.md       # Spec作成ワークフロー
├── reference/                      # 参照用実装ファイル（実行不可）
│   ├── frontend/                   # フロントエンド参照実装
│   ├── backend/                    # バックエンド参照実装
│   ├── spec-implementation-plan.md # Spec実装計画
│   └── README.md                   # 参照ファイル説明
├── frontend/                       # Next.js フロントエンド
│   ├── src/
│   │   ├── app/                    # App Router
│   │   │   ├── api/                # API Routes
│   │   │   │   └── auth/           # NextAuth.js認証
│   │   │   │       └── [...nextauth]/
│   │   │   │           └── route.ts # 認証エンドポイント
│   │   │   ├── favicon.ico         # ファビコン
│   │   │   ├── metadata.ts         # メタデータ設定
│   │   │   └── providers.tsx       # グローバルプロバイダー
│   │   ├── components/             # UIコンポーネント（Specで作成）
│   │   ├── lib/                    # ユーティリティ・設定（Specで作成）
│   │   └── types/                  # TypeScript型定義（Specで作成）
│   ├── public/                     # 静的ファイル
│   │   └── images/                 # 画像ファイル
│   │       ├── champion/           # チャンピオン画像 (171ファイル)
│   │       ├── item/               # アイテム画像 (634ファイル)
│   │       ├── runes/              # ルーン画像
│   │       └── loading/            # ローディングGIF
│   ├── .env.local.example          # 環境変数テンプレート
│   ├── .env.local                  # 環境変数（Git除外）
│   ├── .gitignore
│   ├── eslint.config.mjs           # ESLint設定
│   ├── next.config.ts              # Next.js設定
│   ├── package.json                # 依存関係
│   ├── postcss.config.mjs          # PostCSS設定
│   ├── tailwind.config.js          # Tailwind CSS設定
│   ├── tsconfig.json               # TypeScript設定
│   └── README.md
├── backend/                        # FastAPI バックエンド
│   ├── api/                        # APIエンドポイント（Specで作成）
│   ├── models/                     # データモデル（Specで作成）
│   ├── .env.example                # 環境変数テンプレート
│   ├── .env                        # 環境変数（Git除外）
│   ├── .gitignore
│   ├── config.py                   # 設定管理
│   ├── requirements.txt            # Python依存関係
│   └── README.md
├── .gitignore                      # Git除外設定
└── README.md                       # プロジェクト説明書
```

## ディレクトリの役割

### ルートディレクトリ

#### `/.kiro/steering/` - ステアリングファイル
AIアシスタントがコードを書く際の具体的な指示とルールを定義。

- **tech.md**: 技術スタック、制約、環境変数
- **product.md**: プロダクトビジョン、機能、ユーザーストーリー
- **structure.md**: リポジトリ構造、命名規則
- **coding-rules.md**: 共通コーディング規約
- **frontend-coding-guidelines.md**: フロントエンド固有規約
- **backend-coding-guidelines.md**: バックエンド固有規約

#### `/.kiro/specs/` - Spec定義ファイル
Kiroを使った機能開発のSpec（要件・設計・タスク）を管理。

#### `/docs/` - プロジェクトドキュメント
プロダクトの「何を作るか」「どう作るか」を定義する恒久的なドキュメント。

- **ai-coding-workflow.md**: Spec作成時の5フェーズワークフロー

#### `/reference/` - 参照用実装ファイル
過去の手動実装を参照用に保存。実行不可。Spec作成時の参考資料として使用。

- **frontend/**: フロントエンド参照実装
- **backend/**: バックエンド参照実装
- **spec-implementation-plan.md**: Spec実装計画
- **README.md**: 参照ファイルの説明

### フロントエンド構造

#### `/frontend/src/app/` - App Router
Next.js 15のファイルベースルーティング。

**現在の状態**: 認証関連ファイルのみ存在。ページやレイアウトはSpecで作成予定。

**保持されているファイル**:
- `api/auth/[...nextauth]/route.ts`: NextAuth.js認証エンドポイント
- `providers.tsx`: グローバルプロバイダー（SessionProvider等）
- `metadata.ts`: メタデータ設定
- `favicon.ico`: ファビコン

```typescript
// ルーティング例（Specで実装予定）
/                    → app/page.tsx (ホーム)
/summoner/na/player1 → app/summoner/[region]/[name]/page.tsx
/notes               → app/notes/page.tsx
```

#### `/frontend/src/components/` - UIコンポーネント
再利用可能なUIコンポーネント。Specで作成予定。

**命名規則**: PascalCase（例: `GlobalLoading.tsx`）

#### `/frontend/src/lib/` - ユーティリティ
アプリケーション全体で使用する共通機能。Specで作成予定。

- **api/**: API通信関連
- **hooks/**: カスタムReactフック
- **utils/**: ユーティリティ関数

#### `/frontend/public/images/` - 画像ファイル
静的画像ファイルの配置。

- **champion/**: チャンピオン画像 (171ファイル)
- **item/**: アイテム画像 (634ファイル)
- **runes/**: ルーン画像
- **loading/**: ローディングGIF

**パス指定**: 絶対パス `/images/champion/Ahri.png`

### バックエンド構造

#### `/backend/api/` - APIエンドポイント
FastAPI エンドポイントの実装。Specで作成予定。

```python
# エンドポイント例（Specで実装予定）
GET  /api/summoner/{region}/{name}
GET  /api/notes
POST /api/notes
PUT  /api/notes/{id}
DELETE /api/notes/{id}
```

#### `/backend/models/` - データモデル
データベースモデル定義。Specで作成予定（今後SQLAlchemy使用予定）。

#### `/backend/` - 設定・エントリーポイント
- **config.py**: 設定管理（保持）
- **requirements.txt**: 依存関係（保持）
- **main.py**: FastAPIアプリケーション（Specで作成予定）

## ファイル命名規則

### フロントエンド

#### コンポーネントファイル
```typescript
// PascalCase
GlobalLoading.tsx
SummonerProfile.tsx
ChampionSelector.tsx
```

#### ユーティリティ・フック
```typescript
// camelCase
useSummoner.ts
apiClient.ts
validation.ts
constants.ts
```

#### ページファイル
```typescript
// Next.js規約
page.tsx        // ページ
layout.tsx      // レイアウト
loading.tsx     // ローディングUI
error.tsx       // エラーUI
not-found.tsx   // 404ページ
```

### バックエンド

#### Pythonファイル
```python
# snake_case
note_model.py
summoner_service.py
riot_api_client.py
```

#### 設定ファイル
```python
# snake_case
main.py
config.py
requirements.txt
```

## インポート順序

### TypeScript/React
```typescript
// 1. 外部ライブラリ
import React from 'react';
import { NextPage } from 'next';

// 2. 内部ライブラリ（絶対パス）
import { Button } from '@/components/ui/Button';
import { useSummoner } from '@/lib/hooks/useSummoner';

// 3. 相対パス
import './styles.css';
import { validateInput } from '../utils/validation';
```

### Python
```python
# 1. 標準ライブラリ
import os
from datetime import datetime

# 2. サードパーティライブラリ
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

# 3. ローカルモジュール
from config import settings
from models.note_model import Note
```

## ファイル構造パターン

### Reactコンポーネント
```typescript
// 例: GlobalLoading.tsx（Specで作成予定）
export default function GlobalLoading({ loading }: { loading: boolean }) {
  if (!loading) return null;
  
  return (
    <div style={{ /* ... */ }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/loading/nunu.gif" alt="Loading" width={240} height={240} />
    </div>
  );
}
```

### FastAPIエンドポイント
```python
# 例: api/notes.py（Specで作成予定）
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/notes", tags=["notes"])

@router.get("/")
async def get_notes():
    """ノート一覧を取得"""
    pass

@router.post("/")
async def create_note(note: NoteCreate):
    """ノートを作成"""
    pass
```

### 認証設定（保持されているファイル）
```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// NextAuth設定（変更不要）
```

```typescript
// app/providers.tsx
"use client";
import { SessionProvider } from "next-auth/react";

// グローバルプロバイダー（変更不要）
```

## 環境変数管理

### フロントエンド
```bash
# .env.local.example (テンプレート)
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# .env.local (ローカル開発 - Git除外)
# 実際の値を設定
```

### バックエンド
```bash
# .env.example (テンプレート)
RIOT_API_KEY=your-riot-api-key
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-service-key
CORS_ORIGINS=["http://localhost:3000","https://lollab.vercel.app"]

# .env (ローカル開発 - Git除外)
# 実際の値を設定
```

## Git除外設定

### フロントエンド (.gitignore)
```gitignore
# 依存関係
node_modules/

# 環境変数
.env.local
.env.production

# ビルド成果物
.next/
out/

# ログ
*.log

# IDE
.vscode/
.idea/

# OS
.DS_Store
```

### バックエンド (.gitignore)
```gitignore
# 依存関係
__pycache__/
*.pyc
*.pyo

# 環境変数
.env

# 仮想環境
venv/
env/

# IDE
.vscode/
.idea/

# OS
.DS_Store
```

## ディレクトリ作成ルール

### 新規機能追加時

#### フロントエンド
```bash
# 新しいページ追加
frontend/src/app/new-feature/
├── page.tsx
├── layout.tsx (必要に応じて)
└── loading.tsx (必要に応じて)

# 新しいコンポーネント追加
frontend/src/components/new-feature/
├── FeatureComponent.tsx
└── FeatureCard.tsx
```

#### バックエンド
```bash
# 新しいAPIエンドポイント追加
backend/api/
└── new_feature.py

# 新しいモデル追加
backend/models/
└── new_feature_model.py
```

## パス解決設定

### TypeScript (tsconfig.json)
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**使用例**:
```typescript
import { Button } from '@/components/ui/Button';
import { useSummoner } from '@/lib/hooks/useSummoner';
```

## ファイルサイズガイドライン

### 推奨サイズ
- **コンポーネント**: 200行以内
- **ユーティリティ**: 100行以内
- **APIエンドポイント**: 300行以内

### 大きくなった場合
- コンポーネントを分割
- ロジックを別ファイルに抽出
- 共通処理をユーティリティ化

## ドキュメント配置ルール

### ステアリングファイル (`.kiro/steering/`)
AIアシスタント向けの技術的指示。頻繁に参照される。

### Spec定義ファイル (`.kiro/specs/`)
Kiroを使った機能開発のSpec（要件・設計・タスク）を管理。

### プロジェクトドキュメント (`docs/`)
人間向けの詳細ドキュメント。恒久的な設計情報。

### 参照ファイル (`reference/`)
過去の手動実装を参照用に保存。実行不可。Spec作成時の参考資料として使用。

### README
各ディレクトリに配置し、そのディレクトリの概要を説明。

## 今後の構造拡張予定

### Specで作成予定（短期）
```
frontend/src/
├── app/
│   ├── page.tsx              # ホームページ
│   ├── layout.tsx            # ルートレイアウト
│   ├── globals.css           # グローバルスタイル
│   └── notes/                # ノート機能
├── components/               # UIコンポーネント
├── lib/
│   ├── api/                  # API通信
│   ├── hooks/                # カスタムフック
│   └── utils/                # ユーティリティ
└── types/                    # TypeScript型定義

backend/
├── main.py                   # FastAPIエントリーポイント
├── api/
│   ├── notes.py              # ノート管理API
│   └── users.py              # ユーザー管理API
├── models/
│   └── note_model.py         # ノートモデル
├── schemas/                  # Pydanticスキーマ
├── services/                 # ビジネスロジック
└── utils/                    # ユーティリティ
```

### 中期追加予定
```
frontend/
└── __tests__/                # テストファイル

backend/
└── tests/                    # テストファイル
```
