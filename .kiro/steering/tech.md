# 技術スタック定義

## 概要

このドキュメントはLoL Labプロジェクトで使用する技術スタックと技術的制約を定義します。

## フロントエンド技術

### コア技術
- **Next.js 15**: React フレームワーク (App Router)
- **TypeScript 5**: 型安全性とコード品質向上
- **React 19**: ユーザーインターフェース構築
- **Tailwind CSS 4**: ユーティリティファーストCSS

### 認証・セキュリティ
- **NextAuth.js 4**: 認証システム
- **Google OAuth 2.0**: ソーシャルログイン

### データ管理
- **Supabase Client**: PostgreSQL データベースクライアント
- **fetch API**: データフェッチング

## バックエンド技術

### コア技術
- **Python 3.11+**: プログラミング言語
- **FastAPI**: 高性能WebAPIフレームワーク
- **Pydantic**: データ検証とシリアライゼーション
- **Uvicorn**: ASGIサーバー

### データベース
- **Supabase**: PostgreSQL データベース (BaaS)
- **SQLAlchemy**: ORM (今後導入予定)

### 外部API
- **Riot Games API**: League of Legends データ取得
- **httpx**: 非同期HTTPクライアント (今後導入予定)

## インフラストラクチャ

### デプロイメント
- **Vercel**: フロントエンドホスティング
- **Vercel Functions**: サーバーレスバックエンド (今後)
- **Supabase**: データベースホスティング

### 開発ツール
- **Git**: バージョン管理
- **GitHub**: コードリポジトリ
- **ESLint**: コード品質チェック (フロントエンド)

## 技術的制約

### パフォーマンス制約
- **API応答時間**: 平均3秒以内、最大5秒
- **ページロード時間**: 初回2秒以内、以降1秒以内
- **同時接続数**: 1,000ユーザー対応目標

### リソース制約
- **Riot API制限**: 100req/2min (個人キー)
- **Vercel制限**: 無料プランの制約内で運用

### セキュリティ制約
- **認証**: OAuth 2.0必須
- **データ暗号化**: HTTPS通信必須
- **入力検証**: 全ユーザー入力の検証必須

## ブラウザサポート

### デスクトップ
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### モバイル
- iOS 14+
- Android 10+

## 環境変数

### フロントエンド (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### バックエンド (.env)
```bash
RIOT_API_KEY=your-riot-api-key
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-service-key
CORS_ORIGINS=["http://localhost:3000","https://lollab.vercel.app"]
```

## 依存関係管理

### フロントエンド主要パッケージ
```json
{
  "dependencies": {
    "next": "15.5.9",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "@supabase/supabase-js": "^2.43.4",
    "next-auth": "^4.24.11"
  },
  "devDependencies": {
    "typescript": "^5",
    "tailwindcss": "^4.1.14",
    "eslint": "^9.36.0"
  }
}
```

### バックエンド主要パッケージ
```txt
fastapi
uvicorn[standard]
requests
pydantic-settings
```

## API設計原則

### RESTful API
- **エンドポイント**: `/api/v1/` プレフィックス (今後)
- **HTTPメソッド**: GET, POST, PUT, DELETE
- **ステータスコード**: 標準HTTPステータスコード使用

### レスポンス形式
```typescript
interface APIResponse<T> {
  data: T;
  status: 'success' | 'error';
  message?: string;
}
```

## パフォーマンス最適化

### フロントエンド
- **画像最適化**: Next.js Image (静的画像)、通常のimg (GIF)
- **コード分割**: 動的インポート活用
- **キャッシング**: ブラウザキャッシュ活用

### バックエンド
- **レスポンスキャッシュ**: Riot APIレスポンスのキャッシング (今後)
- **非同期処理**: async/await活用
- **データベース最適化**: インデックス活用 (今後)

## セキュリティ対策

### 認証・認可
- OAuth 2.0による安全な認証
- JWTトークンベースのセッション管理
- ユーザー固有データの分離

### データ保護
- HTTPS通信の強制
- 環境変数による機密情報管理
- 入力バリデーション

### API セキュリティ
- CORS設定
- レート制限 (今後)
- 入力サニタイゼーション

## 開発環境セットアップ

### 必要なソフトウェア
```bash
# Node.js (LTS版)
node --version  # v18.17.0+

# Python
python --version  # 3.11+

# Git
git --version  # 2.40.0+
```

### セットアップ手順
```bash
# フロントエンド
cd frontend
npm install
npm run dev

# バックエンド
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

## 今後の技術導入予定

### 短期 (1-3ヶ月)
- Redis: キャッシング
- SQLAlchemy: ORM
- pytest: バックエンドテスト

### 中期 (3-6ヶ月)
- Jest + React Testing Library: フロントエンドテスト
- GitHub Actions: CI/CD
- Sentry: エラー監視

### 長期 (6ヶ月以降)
- GraphQL: API改善
- WebSocket: リアルタイム機能
- Docker: コンテナ化
