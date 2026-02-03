# リポジトリ構造定義書

## フォルダ・ファイル構成

```
lollab/
├── docs/                           # 永続的ドキュメント
│   ├── product-requirements.md     # プロダクト要求定義書
│   ├── functional-design.md        # 機能設計書
│   ├── architecture.md             # 技術仕様書
│   ├── repository-structure.md     # リポジトリ構造定義書
│   ├── development-guidelines.md   # 開発ガイドライン
│   └── glossary.md                 # ユビキタス言語定義
├── frontend/                       # Next.js フロントエンド
│   ├── src/
│   │   ├── app/                    # App Router (Next.js 14)
│   │   │   ├── (auth)/             # 認証関連ページグループ
│   │   │   │   ├── login/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── layout.tsx
│   │   │   ├── summoner/           # サモナー関連ページ
│   │   │   │   └── [region]/
│   │   │   │       └── [name]/
│   │   │   │           └── page.tsx
│   │   │   ├── notes/              # ノート管理ページ
│   │   │   │   ├── page.tsx        # ノート一覧
│   │   │   │   ├── create/
│   │   │   │   │   └── page.tsx    # ノート作成
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx    # ノート詳細
│   │   │   │       └── edit/
│   │   │   │           └── page.tsx # ノート編集
│   │   │   ├── globals.css         # グローバルスタイル
│   │   │   ├── layout.tsx          # ルートレイアウト
│   │   │   ├── page.tsx            # ホームページ
│   │   │   ├── loading.tsx         # ローディングUI
│   │   │   ├── error.tsx           # エラーUI
│   │   │   └── not-found.tsx       # 404ページ
│   │   ├── components/             # UIコンポーネント
│   │   │   ├── ui/                 # 基本UIコンポーネント
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── Table.tsx
│   │   │   │   ├── LoadingSpinner.tsx
│   │   │   │   └── ErrorBoundary.tsx
│   │   │   ├── layout/             # レイアウトコンポーネント
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Navigation.tsx
│   │   │   │   ├── Footer.tsx
│   │   │   │   └── Sidebar.tsx
│   │   │   ├── summoner/           # サモナー関連コンポーネント
│   │   │   │   ├── SearchBar.tsx
│   │   │   │   ├── SummonerProfile.tsx
│   │   │   │   ├── MatchHistory.tsx
│   │   │   │   └── RankInfo.tsx
│   │   │   ├── notes/              # ノート関連コンポーネント
│   │   │   │   ├── NotesList.tsx
│   │   │   │   ├── NoteCard.tsx
│   │   │   │   ├── NoteEditor.tsx
│   │   │   │   ├── NoteFilters.tsx
│   │   │   │   └── ChampionSelector.tsx
│   │   │   └── common/             # 共通コンポーネント
│   │   │       ├── SearchInput.tsx
│   │   │       ├── Pagination.tsx
│   │   │       └── Toast.tsx
│   │   ├── lib/                    # ユーティリティ・設定
│   │   │   ├── api/                # API関連
│   │   │   │   ├── client.ts       # APIクライアント
│   │   │   │   ├── summoner.ts     # サモナーAPI
│   │   │   │   ├── notes.ts        # ノートAPI
│   │   │   │   └── auth.ts         # 認証API
│   │   │   ├── hooks/              # カスタムフック
│   │   │   │   ├── useSummoner.ts
│   │   │   │   ├── useNotes.ts
│   │   │   │   ├── useAuth.ts
│   │   │   │   └── useLocalStorage.ts
│   │   │   ├── utils/              # ユーティリティ関数
│   │   │   │   ├── validation.ts
│   │   │   │   ├── formatting.ts
│   │   │   │   ├── constants.ts
│   │   │   │   └── helpers.ts
│   │   │   ├── types/              # 型定義
│   │   │   │   ├── summoner.ts
│   │   │   │   ├── notes.ts
│   │   │   │   ├── user.ts
│   │   │   │   └── api.ts
│   │   │   ├── data/               # 静的データ
│   │   │   │   ├── champions.ts    # チャンピオンデータ
│   │   │   │   ├── items.ts        # アイテムデータ
│   │   │   │   ├── runes.ts        # ルーンデータ
│   │   │   │   └── regions.ts      # リージョンデータ
│   │   │   └── auth.ts             # NextAuth設定
│   │   └── styles/                 # スタイル関連
│   │       ├── globals.css
│   │       └── components.css
│   ├── public/                     # 静的ファイル
│   │   ├── images/                 # 画像ファイル
│   │   │   ├── champions/          # チャンピオン画像
│   │   │   ├── items/              # アイテム画像
│   │   │   ├── runes/              # ルーン画像
│   │   │   └── icons/              # アイコン画像
│   │   ├── favicon.ico
│   │   └── manifest.json
│   ├── __tests__/                  # テストファイル
│   │   ├── components/             # コンポーネントテスト
│   │   ├── pages/                  # ページテスト
│   │   ├── lib/                    # ユーティリティテスト
│   │   └── __mocks__/              # モックファイル
│   ├── .env.local                  # 環境変数（ローカル）
│   ├── .env.example                # 環境変数テンプレート
│   ├── next.config.js              # Next.js設定
│   ├── tailwind.config.js          # Tailwind CSS設定
│   ├── tsconfig.json               # TypeScript設定
│   ├── package.json                # 依存関係
│   └── README.md                   # フロントエンド説明書
├── backend/                        # FastAPI バックエンド
│   ├── app/                        # アプリケーションコード
│   │   ├── api/                    # APIエンドポイント
│   │   │   ├── v1/                 # APIバージョン1
│   │   │   │   ├── endpoints/      # エンドポイント実装
│   │   │   │   │   ├── summoner.py
│   │   │   │   │   ├── notes.py
│   │   │   │   │   ├── users.py
│   │   │   │   │   └── health.py
│   │   │   │   └── api.py          # APIルーター
│   │   │   └── deps.py             # 依存関係
│   │   ├── core/                   # コア機能
│   │   │   ├── config.py           # 設定管理
│   │   │   ├── security.py         # セキュリティ
│   │   │   ├── database.py         # データベース接続
│   │   │   └── cache.py            # キャッシュ管理
│   │   ├── models/                 # データモデル
│   │   │   ├── user.py
│   │   │   ├── note.py
│   │   │   └── base.py
│   │   ├── schemas/                # Pydanticスキーマ
│   │   │   ├── summoner.py
│   │   │   ├── note.py
│   │   │   ├── user.py
│   │   │   └── common.py
│   │   ├── services/               # ビジネスロジック
│   │   │   ├── summoner_service.py
│   │   │   ├── note_service.py
│   │   │   ├── user_service.py
│   │   │   └── riot_api_service.py
│   │   ├── utils/                  # ユーティリティ
│   │   │   ├── riot_api.py         # Riot API クライアント
│   │   │   ├── cache_utils.py      # キャッシュユーティリティ
│   │   │   ├── validation.py       # バリデーション
│   │   │   └── helpers.py          # ヘルパー関数
│   │   └── main.py                 # FastAPIアプリケーション
│   ├── tests/                      # テストファイル
│   │   ├── api/                    # APIテスト
│   │   ├── services/               # サービステスト
│   │   ├── utils/                  # ユーティリティテスト
│   │   ├── conftest.py             # pytest設定
│   │   └── test_main.py            # メインテスト
│   ├── alembic/                    # データベースマイグレーション
│   │   ├── versions/               # マイグレーションファイル
│   │   ├── env.py                  # Alembic環境設定
│   │   └── alembic.ini             # Alembic設定
│   ├── .env                        # 環境変数
│   ├── .env.example                # 環境変数テンプレート
│   ├── requirements.txt            # Python依存関係
│   ├── requirements-dev.txt        # 開発用依存関係
│   ├── pyproject.toml              # Python プロジェクト設定
│   └── README.md                   # バックエンド説明書
├── database/                       # データベース関連
│   ├── migrations/                 # マイグレーションスクリプト
│   ├── seeds/                      # 初期データ
│   │   ├── champions.sql
│   │   ├── items.sql
│   │   └── runes.sql
│   └── schema.sql                  # データベーススキーマ
├── scripts/                        # 運用スクリプト
│   ├── setup.sh                    # 環境セットアップ
│   ├── deploy.sh                   # デプロイスクリプト
│   ├── backup.sh                   # バックアップスクリプト
│   └── seed-data.py                # データ投入スクリプト
├── .github/                        # GitHub設定
│   ├── workflows/                  # GitHub Actions
│   │   ├── ci.yml                  # CI パイプライン
│   │   ├── cd.yml                  # CD パイプライン
│   │   └── test.yml                # テスト実行
│   ├── ISSUE_TEMPLATE/             # Issue テンプレート
│   └── PULL_REQUEST_TEMPLATE.md    # PR テンプレート
├── .gitignore                      # Git除外設定
├── .env.example                    # 環境変数テンプレート
├── docker-compose.yml              # 開発環境Docker設定
├── README.md                       # プロジェクト説明書
└── LICENSE                         # ライセンス
```

## ディレクトリの役割

### ルートディレクトリ

#### `/docs/` - 永続的ドキュメント
プロダクトの「何を作るか」「どう作るか」を定義する恒久的なドキュメント。アプリケーションの基本設計や方針が変わらない限り更新されない。

- **product-requirements.md**: プロダクト要求定義書
- **functional-design.md**: 機能設計書  
- **architecture.md**: 技術仕様書
- **repository-structure.md**: リポジトリ構造定義書
- **development-guidelines.md**: 開発ガイドライン
- **glossary.md**: ユビキタス言語定義

#### `/frontend/` - Next.js フロントエンド
ユーザーインターフェースとクライアントサイドロジックを含む。

#### `/backend/` - FastAPI バックエンド  
API エンドポイント、ビジネスロジック、データアクセス層を含む。

#### `/database/` - データベース関連
スキーマ定義、マイグレーション、初期データを管理。

#### `/scripts/` - 運用スクリプト
環境セットアップ、デプロイ、バックアップなどの自動化スクリプト。

### フロントエンド構造

#### `/src/app/` - App Router (Next.js 14)
ファイルベースルーティングによるページ定義。

```typescript
// ルーティング例
/                    → app/page.tsx (ホーム)
/login               → app/(auth)/login/page.tsx
/summoner/na/player1 → app/summoner/[region]/[name]/page.tsx
/notes               → app/notes/page.tsx
/notes/create        → app/notes/create/page.tsx
/notes/123           → app/notes/[id]/page.tsx
/notes/123/edit      → app/notes/[id]/edit/page.tsx
```

#### `/src/components/` - UIコンポーネント
再利用可能なUIコンポーネントを機能別に分類。

- **ui/**: 基本的なUIコンポーネント（Button、Input等）
- **layout/**: レイアウト関連コンポーネント
- **summoner/**: サモナー機能専用コンポーネント
- **notes/**: ノート機能専用コンポーネント
- **common/**: 複数機能で共有するコンポーネント

#### `/src/lib/` - ユーティリティ・設定
アプリケーション全体で使用する共通機能。

- **api/**: API通信関連
- **hooks/**: カスタムReactフック
- **utils/**: ユーティリティ関数
- **types/**: TypeScript型定義
- **data/**: 静的データ（チャンピオン、アイテム等）

### バックエンド構造

#### `/app/api/` - APIエンドポイント
RESTful APIエンドポイントの実装。バージョニング対応。

```python
# エンドポイント例
GET  /api/v1/summoner/{region}/{name}     → endpoints/summoner.py
GET  /api/v1/summoner/{region}/{name}/matches
GET  /api/v1/notes                        → endpoints/notes.py
POST /api/v1/notes
PUT  /api/v1/notes/{id}
DELETE /api/v1/notes/{id}
```

#### `/app/services/` - ビジネスロジック
ドメインロジックとビジネスルールの実装。

- **summoner_service.py**: サモナー関連ビジネスロジック
- **note_service.py**: ノート管理ビジネスロジック
- **riot_api_service.py**: Riot API統合ロジック

#### `/app/models/` - データモデル
SQLAlchemy ORMモデル定義。

#### `/app/schemas/` - Pydanticスキーマ
API リクエスト/レスポンスのデータ検証とシリアライゼーション。

## ファイル配置ルール

### 命名規則

#### ファイル名
```typescript
// React コンポーネント: PascalCase
SummonerProfile.tsx
MatchHistory.tsx
NoteEditor.tsx

// ユーティリティ・フック: camelCase
useSummoner.ts
apiClient.ts
validation.ts

// 定数・設定: camelCase
constants.ts
config.ts
```

#### ディレクトリ名
```bash
# kebab-case (推奨)
champion-selector/
match-history/
user-profile/

# camelCase (許可)
championSelector/
matchHistory/
userProfile/
```

### インポート順序
```typescript
// 1. 外部ライブラリ
import React from 'react';
import { NextPage } from 'next';
import axios from 'axios';

// 2. 内部ライブラリ（絶対パス）
import { Button } from '@/components/ui/Button';
import { useSummoner } from '@/lib/hooks/useSummoner';

// 3. 相対パス
import './styles.css';
import { validateInput } from '../utils/validation';
```

### ファイル構造パターン

#### コンポーネントファイル
```typescript
// SummonerProfile.tsx
import React from 'react';
import { SummonerData } from '@/lib/types/summoner';

interface SummonerProfileProps {
  summoner: SummonerData;
  loading?: boolean;
}

export const SummonerProfile: React.FC<SummonerProfileProps> = ({
  summoner,
  loading = false
}) => {
  // コンポーネント実装
};

export default SummonerProfile;
```

#### API サービスファイル
```typescript
// lib/api/summoner.ts
import { apiClient } from './client';
import { SummonerResponse } from '@/lib/types/api';

export const summonerApi = {
  getSummoner: async (region: string, name: string): Promise<SummonerResponse> => {
    const response = await apiClient.get(`/summoner/${region}/${name}`);
    return response.data;
  },
  
  getMatches: async (region: string, name: string) => {
    const response = await apiClient.get(`/summoner/${region}/${name}/matches`);
    return response.data;
  }
};
```

### 環境別設定

#### 環境変数管理
```bash
# .env.example (テンプレート)
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# .env.local (ローカル開発)
NEXT_PUBLIC_API_URL=http://localhost:8000
# ... 実際の値

# .env.production (本番環境)
NEXT_PUBLIC_API_URL=https://api.lollab.com
# ... 本番環境の値
```

#### 設定ファイル分離
```typescript
// lib/config/index.ts
const config = {
  development: {
    apiUrl: 'http://localhost:8000',
    cacheTimeout: 60000, // 1分
  },
  production: {
    apiUrl: 'https://api.lollab.com',
    cacheTimeout: 300000, // 5分
  }
};

export default config[process.env.NODE_ENV || 'development'];
```

## バージョン管理ルール

### Git ブランチ戦略

```bash
main                    # 本番環境
├── develop            # 開発統合ブランチ
├── feature/user-auth  # 機能開発ブランチ
├── feature/summoner-search
├── hotfix/critical-bug # 緊急修正ブランチ
└── release/v1.0.0     # リリース準備ブランチ
```

### コミットメッセージ規約

```bash
# 形式: <type>(<scope>): <description>

feat(auth): add Google OAuth integration
fix(api): resolve summoner search timeout issue
docs(readme): update installation instructions
style(ui): improve button component styling
refactor(services): extract common API logic
test(notes): add unit tests for note creation
chore(deps): update dependencies to latest versions
```

### ファイル除外設定

```gitignore
# .gitignore

# 依存関係
node_modules/
__pycache__/
*.pyc

# 環境変数
.env.local
.env.production
.env

# ビルド成果物
.next/
dist/
build/

# ログファイル
*.log
logs/

# IDE設定
.vscode/
.idea/
*.swp
*.swo

# OS生成ファイル
.DS_Store
Thumbs.db

# テストカバレッジ
coverage/
.nyc_output/

# 一時ファイル
*.tmp
*.temp
```

## 依存関係管理

### パッケージ管理戦略

#### フロントエンド (package.json)
```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "typescript": "^5.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0"
  },
  "peerDependencies": {
    "react": ">=18.0.0"
  }
}
```

#### バックエンド (requirements.txt)
```txt
# 本番依存関係
fastapi==0.104.1
uvicorn==0.24.0
pydantic==2.5.0
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
redis==5.0.1

# 開発依存関係 (requirements-dev.txt)
pytest==7.4.3
pytest-asyncio==0.21.1
black==23.11.0
flake8==6.1.0
mypy==1.7.1
```

### 依存関係更新ポリシー

1. **セキュリティ更新**: 即座に適用
2. **マイナー更新**: 月次レビューで適用
3. **メジャー更新**: 四半期レビューで慎重に適用
4. **破壊的変更**: 十分なテストとドキュメント更新後に適用