# 実装計画: 試合の自動収集（クローラー）

## 概要

参照: `requirements.md`、`design.md`、`../database/design.md`、`../summoner-search-api/design.md`（試合データの取り込み）、`../champion-stats/design.md`（ランク帯の絞り込み）、`docs/architecture.md`（デプロイ・運用）

前提: database Spec タスク11〜12 が完了していること（`crawler_seeds`・`rank_tier`・`prune_crawler_matches` がないと保存できない）

## タスク

- [x] 1. バックエンド: 既存の取得・保存処理の拡張
  - [x] 1.1 `adapters/raw_store.py` に `RawArchive`（Protocol）と既定の1試合1ファイルの実装を追加し、`match_bundle.fetch_match`・`riot_fetch.fetch_match_details` に `archive` 引数を足す（None は既定。検索・Backfill の挙動は変えない）
  - [x] 1.2 `riot_fetch.fetch_ranked_match_ids` に `queue` 引数を足す
  - [x] 1.3 `MatchRecord`・`ParticipantRecord` に `rank_tier` を足し、None のときは保存時に書き込まない（タイムライン由来の列と同じ扱い）
  - [x] 1.4 テスト: 既存のテストが変更なしで通ること、`archive` を渡したときの保存先、`queue` の指定、`rank_tier` が None なら既存の値を消さないこと
    - _要件: 1.4, 2.2, 4.5_

- [x] 2. バックエンド: 生データのまとめ保存
  - [x] 2.1 `adapters/raw_bundle_store.py` の `BundleArchive`（gzip ストリームへの追記、`flush` で S3 に1回書き込み、0件なら書き込まない）
  - [x] 2.2 テスト（moto）: 追記した行を読み戻せる、0件なら書き込まない、書き込み失敗は例外として呼び出し側に伝える
    - _要件: 4.4_

- [x] 3. バックエンド: 収集元プレイヤー
  - [x] 3.1 `schemas/crawler.py` に design.md のモデルを定義する
  - [x] 3.2 `adapters/crawler_seed_store.py`
  - [x] 3.3 `services/crawler/seeds.py`（24時間ごとの更新、7日で削除、3つの帯から交互に古い順で選択）
  - [x] 3.4 テスト: 更新の要否、帯ごとの交互の選択、古い順、削除、更新失敗時に既存の収集元で続ける
    - _要件: 1.3, 1.6_

- [x] 4. バックエンド: 収集と1回の起動
  - [x] 4.1 `services/crawler/collect.py`（`queue=420`・期間の指定、保存済み・取得不能の除外、ランク帯の付与、失敗の記録、成功時だけ収集日時を更新）
  - [x] 4.2 `services/crawler/prune.py`（RPC の呼び出し）
  - [x] 4.3 `services/crawler/run.py`（締め切り・429・失敗10件での終了、バンドルの書き込み、prune、`CrawlResult` のログ）
  - [x] 4.4 `lambda_handlers/crawler.py`（リース `riot-crawler`、締め切り、リースを必ず返す、接続を閉じる）
  - [x] 4.5 テスト: design.md のテスト方針の `collect.py`・`run.py`・ハンドラーの項目
    - _要件: 1.1〜1.5, 1.8, 2.1, 2.3, 3.3〜3.5, 4.1〜4.3, 6.1, 6.3_

- [x] 5. チェックポイント: バックエンドの全テスト・lint・mypy を通す。ローカルで `run_crawl` を短い締め切りで1回動かし、試合が保存されることを確認する

- [x] 6. インフラ
  - [x] 6.1 `infra/app.yaml`: `CrawlerFunction`・`CrawlerSchedule`・`CrawlerScheduleRole`・`CrawlerRole`・`CrawlerLogGroup`、パラメータ `CrawlerEnabled`・`CrawlerRateLimits`、`ApiRateLimits`・`BackfillRateLimits` の既定値の変更
  - [x] 6.2 `infra/bootstrap.yaml`: CloudFormation のサービスロールに Scheduler の権限と `iam:PassRole`（scheduler 向け）、パラメータ `AppCrawlerEnabled`（CodeBuild の環境変数）
  - [x] 6.3 `buildspec.yml`: `APP_CRAWLER_ENABLED` の上書き
  - [x] 6.4 cfn-lint でテンプレートを検証する
    - _要件: 1.1, 3.1, 3.2, 5.1, 5.2, 6.2_

- [x] 7. champion-stats: ランク帯の絞り込み
  - [x] 7.1 バックエンド: `StatsFilter` の `rank_tiers`、`champion_stats_store` の各クエリ（BAN 数は `matches` との内部結合）、API の `rank` パラメータ
  - [x] 7.2 フロントエンド: `BuildFilters` にランク帯のプルダウン、URL クエリ `rank`、型と API 呼び出し
  - [x] 7.3 テスト: ランク帯の絞り込み、`all` では条件なし、URL クエリの反映
    - _要件: champion-stats 4.3, 4.4_

- [x] 8. チェックポイント: フロントエンドとバックエンドの全テスト・lint・build を通す

- [ ] 9. デプロイと確認（po とユーザー）
  - [x] 9.1 bootstrap を更新する（CodeBuild のロールは自分の bootstrap を更新できないため手動）
  - [ ] 9.2 `main` にマージしてデプロイし、1回目の起動のログ・DB の件数・S3 のバンドルを確認する
  - [ ] 9.3 1日動かし、収集数（2,000試合/日以上）・Riot の 429 の有無・Lambda の実行時間を確認する
  - [x] 9.4 DB と S3 の1試合あたりの容量を測り、上限（10万試合）が Supabase の無料枠に収まるか確認する。収まらなければ上限を見直す（実測 1試合 約9.7KB のため4万試合に変更。#82）
  - [x] 9.5 `docs/architecture.md` に、クローラーの構成と停止・再開の手順を追記する
    - _要件: 1.7, 4.1, 5.1, 6.2_
