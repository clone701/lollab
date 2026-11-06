# 技術スタック定義

## 概要

このドキュメントはLoL Labプロジェクトで使用する技術スタックと技術的制約を定義します。構成図・デプロイ・秘密情報・アクセス制限の手順は `docs/architecture.md` を参照。

## フロントエンド技術

### コア技術
- **Next.js 16**: React フレームワーク (App Router、静的書き出し `output: 'export'`)
- **TypeScript 5**: 型安全性とコード品質向上
- **React 19**: ユーザーインターフェース構築
- **Tailwind CSS 4**: ユーティリティファーストCSS

### 認証・セキュリティ
- **Supabase Auth**: 認証（Google OAuth 2.0）。ブラウザで `exchangeCodeForSession` を行う
- **AuthGate**: 未ログイン時はログイン画面だけを表示（`NEXT_PUBLIC_AUTH_GATE_ENABLED`）

### データ管理
- **Supabase Client**: ノート・お気に入りをブラウザから直接読み書き（RLS で本人のデータだけ）
- **apiFetch**（`lib/api/request.ts`）: バックエンド API の呼び出し。`X-Lollab-Auth` と `x-amz-content-sha256` を付ける

### 静的書き出しの制約
- サーバー処理（Route Handler、`await searchParams`、Middleware、`next/image` の最適化）は使えない
- クエリはクライアントで `useSearchParams` を `Suspense` で囲んで読む
- 動的ルートは `generateStaticParams` で全件を事前生成する

## バックエンド技術

### コア技術
- **Python 3.12**: プログラミング言語（Lambda のランタイム）
- **FastAPI**: WebAPI フレームワーク
- **Mangum**: FastAPI を Lambda で動かすアダプター（`lambda_handlers/`）
- **Pydantic / pydantic-settings**: データ検証と設定管理
- **Uvicorn**: ローカル開発用の ASGI サーバー

### データベース・ストレージ
- **Supabase**: PostgreSQL データベース (BaaS)
- **S3**: 試合の生データ（`RAW_BUCKET`。未設定のローカルでは Supabase Storage）

### 外部API
- **Riot Games API**: League of Legends データ取得
- **httpx**: HTTP クライアント

## インフラストラクチャ

### デプロイメント（AWS、ap-northeast-1）
- **CloudFront**: 入口。`/*` は S3 の静的ファイル、`/api/*` は Lambda 関数 URL（どちらも OAC）
- **CloudFront Function `lollab-gate`**: 第1段階のアクセス制限（許可 IP / ベーシック認証）と URL の書き換え
- **Lambda**: `lollab-api`（API）、`lollab-backfill`（過去の試合の取得。API から非同期起動）。arm64、512MB
- **SSM Parameter Store**: 秘密情報（`/lollab/*`、SecureString）
- **CloudFormation**: `infra/bootstrap.yaml`（手動）、`infra/app.yaml`（CodeBuild が更新）
- **CodeBuild `lollab-deploy`**: `buildspec.yml` でビルドとデプロイ。中身が変わった側だけビルドする
- **Supabase**: データベースと認証のホスティング

### 開発ツール
- **Git / GitHub**: バージョン管理・コードリポジトリ
- **GitHub Actions**: テスト。`main` では OIDC で CodeBuild を起動してデプロイ
- **ESLint / Prettier / Jest**: フロントエンドの品質チェックとテスト
- **pytest / hypothesis / moto / black / flake8 / mypy**: バックエンドのテストと品質チェック
- **cfn-lint**: CloudFormation テンプレートの検査

## 技術的制約

### パフォーマンス制約
- **API応答時間**: 平均3秒以内、最大5秒
- **ページロード時間**: 初回2秒以内、以降1秒以内
- **同時接続数**: 1,000ユーザー対応目標

### リソース制約
- **Riot API制限**: Personal キーは 20req/1s・100req/2min。関数ごとに分け合う（`lollab-api` 8:1,50:120、`lollab-backfill` 10:1,45:120。`app.yaml` のパラメータ）
- **費用**: 商用リリースまで AWS の Always Free の範囲（月の予算上限500円）。VPC・NAT・常時起動のサーバー・WAF・Secrets Manager・KMS のカスタマー管理キーは使わない
- **Lambda**: `lollab-api` のタイムアウト29秒（CloudFront の待ち時間30秒以内）、`lollab-backfill` 300秒
- **CodeBuild**: 無料枠は月100分
- **CloudFront Functions**: JavaScript runtime 2.0（ES5.1 と一部の ES6 以降のみ。`for...of`・分割代入・スプレッド構文・クラスは使えない）、コード10KB以内

### セキュリティ制約
- **認証**: OAuth 2.0必須
- **データ暗号化**: HTTPS通信必須
- **入力検証**: 全ユーザー入力の検証必須
- **アクセス制限**: 一般公開まで2段階（第1段階 CloudFront、第2段階 API の許可メール）

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

本番の値は CodeBuild の環境変数（`bootstrap.yaml` のパラメータ）と SSM で管理する。ローカルは次のファイル。

### フロントエンド (.env.local)
```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...   # publishable キー
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000      # 本番は未設定（同じオリジン）
NEXT_PUBLIC_AUTH_GATE_ENABLED=false                # 本番は true
```

### バックエンド (.env)
```bash
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=sb_secret_...                         # secret キー
RIOT_API_KEY=your-riot-api-key
CORS_ORIGINS=["http://localhost:3000"]
DEBUG=False
# Lambda 用（ローカルでは設定しない）: SSM_PARAMETER_PATH, USER_GATE_ENABLED, BACKFILL_MODE, RAW_BUCKET など
```

## API設計原則

### RESTful API
- **エンドポイント**: `/api/` プレフィックス
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
- **画像**: 静的書き出しのため最適化なし（`images.unoptimized`）
- **コード分割**: 動的インポート活用
- **キャッシング**: CloudFront（`_next/static` は1年、ページは5分）

### バックエンド
- **DB キャッシュ**: サモナー・試合は DB に保存し、手動更新で取り直す
- **非同期処理**: async/await 活用。Backfill は別の Lambda
- **データベース最適化**: インデックス活用

## セキュリティ対策

### 認証・認可
- Supabase Auth（Google OAuth 2.0）
- API は `X-Lollab-Auth` の JWT を検証（ES256/RS256 は JWKS、HS256 は JWT シークレットがあるときだけ）
- ユーザー固有データは RLS で分離

### データ保護
- HTTPS通信の強制
- 秘密情報は SSM Parameter Store（ローカルは `.env`）。コード・ログに出さない
- 入力バリデーション

### API セキュリティ
- CloudFront → Lambda は OAC（関数 URL は `AWS_IAM` 認証で直接呼べない）
- Riot API のレート制限（`RIOT_RATE_LIMITS`）
- 入力サニタイゼーション

## 開発環境セットアップ

### 必要なソフトウェア
```bash
node --version    # v22+
python --version  # 3.12+
git --version     # 2.40.0+
aws --version     # 2.x（デプロイ・運用時のみ）
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

- クローラー（30分ごとの Lambda）
- Sentry 等のエラー監視
- 一般公開時: 独自ドメイン、404 ページ、SEO 対応

