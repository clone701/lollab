# 実装計画: AWS 移行

## 概要

参照: `requirements.md`、`design.md`、`../database/design.md`（`worker_leases`）

- 作業ブランチ: `chore/configurable-rate-limits`（ユーザーの指示があるまで切り替えない）
- タスク1〜3はローカルで完結する（AWS に接続しない）。タスク4以降でユーザーの手作業が入る
- 各タスクで既存の機能が壊れないこと（ローカルの `uvicorn` + `next dev` で動くこと）を保つ

## タスク

- [x] 1. バックエンド
  - [x] 1.1 Lambda のハンドラー: `lambda_handlers/api.py`（Mangum）、`lambda_handlers/backfill.py`。`requirements.txt` に `mangum` と `boto3`（ローカル・テスト用。Lambda のランタイムにも含まれる）を追加
    - _要件: 2.1, 2.2_
  - [x] 1.2 `config.py` に `load_ssm_parameters(path)` を追加し、`SSM_PARAMETER_PATH` があれば起動時に SSM から読む。`USER_GATE_ENABLED`、`BACKFILL_MODE`、`BACKFILL_FUNCTION_NAME`、`RAW_BUCKET`、`SUPABASE_PROJECT_REF`（JWKS 用）を設定に追加
    - _要件: 6.1, 6.2_
  - [x] 1.3 `services/summoner/backfill_dispatch.py`: `lambda` モードは非同期起動、`inline` モードは BackgroundTasks。ルーターの `add_task(run_backfill, ...)` を置き換える
    - _要件: 2.3_
  - [x] 1.4 `run_backfill` に締め切りを追加し、残り30秒を切ったらページの区切りで終了する
    - _要件: 2.5_
  - [x] 1.5 `worker_leases` のリース取得（`adapters/worker_lease_store.py`）と、`lollab-backfill` での利用
    - _要件: 3.2_
  - [x] 1.6 `api/deps/auth.py` の `require_allowed_user`（JWKS 検証・許可メール・無効化）を全ルーターに付ける。JWKS（ES256/RS256）と HS256（シークレット設定時のみ）の両方に対応し、それ以外の alg は拒否する。テストは自前で生成した鍵で行う
    - _要件: 5.5, 5.7, 5.8, 5.9_
  - [x] 1.7 `adapters/raw_store.py` の保存先を S3 に切り替える（`RAW_BUCKET` 未設定のローカルでは現行の Supabase Storage を使う）
    - _要件: 4.1, 4.3_
  - [x] 1.8 `scripts/migrate_raw_to_s3.py`（`--dry-run`、件数・サイズの照合、照合後に Supabase 側を削除）
    - _要件: 4.2_
  - [x] 1.9 テスト: design.md「テスト方針」のバックエンドの項目（AWS は moto などでモック、実接続しない）

- [x] 2. フロントエンド
  - [x] 2.1 `next.config.ts` を静的書き出しにし、`/champion/[championName]` に `generateStaticParams` を追加（未使用だった空の `/test-champion-selector`・`/notes/edit/[id]` は削除済み）
    - _要件: 1.1, 1.3, 1.5_
  - [x] 2.2 `/auth/callback` をクライアントのページに置き換え、`route.ts` を削除する
    - _要件: 1.3_
  - [x] 2.3 `lib/api/request.ts` の `apiFetch`（`X-Lollab-Auth`、`x-amz-content-sha256`）を作り、`lib/api/summoner.ts`・`adapters/api/championBuild.ts` から使う。`NEXT_PUBLIC_BACKEND_URL` の既定を空文字にする
    - _要件: 5.5_
  - [x] 2.4 `AuthGate` を `layout.tsx` に置き、未ログイン時はログイン画面、403 時は利用不可の表示にする
    - _要件: 5.6_
  - [x] 2.5 `app/not-found.tsx` を確認し `404.html` が出力されることを確認する
    - _要件: 1.4_
  - [x] 2.6 テスト: `apiFetch` のヘッダー、`AuthGate`、`/auth/callback`。`npm run build` で `out/` に全ページが出ること
    - _要件: 1.2_

- [x] 3. 構成管理と CI/CD
  - [x] 3.1 `infra/functions/gate.js` と、そのテスト（Node で読み込んで単体テスト）
    - _要件: 5.1〜5.4, 5.7_
  - [x] 3.2 `infra/bootstrap.yaml`（OIDC プロバイダー、GitHub Actions 用ロール、成果物バケット、CodeBuild プロジェクト。Budgets はコンソールで作成済みのため含めない）
    - _要件: 7.1, 7.3_
  - [x] 3.3 `infra/app.yaml`（S3 site・raw、CloudFront・OAC・ゲート関数、Lambda 2つ・関数 URL・IAM・ロググループ、ライフサイクル）
    - _要件: 1.1, 2.1, 4.1, 8.1〜8.3, 9.3, 9.4_
  - [x] 3.4 `buildspec.yml`（フロントエンドのビルドと S3 配置、Lambda の ZIP、`app.yaml` の更新、CloudFront 無効化）
    - _要件: 7.2, 7.4_
  - [x] 3.5 `ci.yml` の Node.js を 20 以上にし、`main` でのテスト成功後に CodeBuild を起動して完了を待つデプロイジョブを追加
    - _要件: 7.2, 7.3_
  - [x] 3.6 `cfn-lint` でテンプレートを検証する

- [x] 0. 費用の通知（AWS アカウント作成直後、他の作業より先に行う。ユーザーの手作業）
  - [x] 0.1 AWS Budgets で予算を作り、メール通知する（作成済み: `lollab-zero-spend`、`My Monthly Cost Budget`（月 $1））
  - [x] 0.2 請求設定で「無料利用枠の使用アラート」を有効にする
    - _要件: 9.2_

- [ ] 4. 初回の準備（ユーザーの手作業。po が手順を用意する）
  - [ ] 4.1 IAM Identity Center のユーザー作成（ルートユーザーの MFA は登録済み）
    - _要件: 8.4_
  - [ ] 4.2 `bootstrap.yaml` のデプロイ、CodeConnections の GitHub 連携、SSM パラメータの登録、ベーシック認証のパスワードとハッシュの作成
    - _要件: 6.1_
  - [ ] 4.3 database Spec のタスク（`worker_leases`）のマイグレーションを本番 DB に適用
  - [ ] 4.4 フロントエンドの anon キー（旧形式の JWT）を publishable キー（`sb_publishable_...`）に置き換える（ローカルの `.env.local`・Vercel・CodeBuild の環境変数）。旧形式のキーは Supabase が2026年末までに廃止予定のため、移行と関係なく早めに行う
  - [ ] 4.5 SSM に `/lollab/supabase_jwt_secret` を登録する（HS256 の検証用。Supabase を非対称鍵に移行したら削除する）
    - _要件: 5.5_

- [ ] 5. 初回デプロイと確認
  - [ ] 5.1 `main` へのマージで初回デプロイし、CloudFront の URL で全画面を確認する（ゲート有効・許可外 IP・許可外メール・ゲート無効）
    - _要件: 1.2, 5.1〜5.6, 10.1_
  - [ ] 5.2 Supabase Auth のリダイレクト URL に CloudFront の URL を追加
  - [ ] 5.3 `migrate_raw_to_s3.py` で生データを移す
    - _要件: 4.2_
  - [ ] 5.4 1回目の請求見込み（Cost Explorer）が0円であることを確認する
    - _要件: 9.1_

- [ ] 6. 切り替えと後片付け
  - [ ] 6.1 Vercel・Render を停止し、数日後に削除。Supabase Auth のリダイレクト URL から Vercel の URL を消す
    - _要件: 10.2_
  - [ ] 6.2 `docs/architecture.md`（構成図、CI/CD 図、デプロイ・秘密情報・アクセス制限の手順、コスト方針）を作成
    - _要件: 10.4_
  - [ ] 6.3 `tech.md`・`structure.md` と各 Spec の Vercel・Render の記述を更新（`infra/`・`lambda_handlers/` を structure に追加）
    - _要件: 10.3_
  - [ ] 6.4 本 Spec（`.kiro/specs/aws-migration/`）を削除
    - _要件: 10.4_
