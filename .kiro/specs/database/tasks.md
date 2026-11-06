# 実装計画: データベース

## 概要

`supabase/migrations/` に SQL ファイルを作成する。命名・冪等性・書式は design.md の「マイグレーション」のルールに従う。本番 DB への適用はユーザーが Supabase SQL Editor で手動実行する。

- 作成済み: `champion_notes`、`favorites`、`general_notes`（`20240101`〜`20240104` のマイグレーション）
- 本計画: `summoners`、`matches`、`match_participants`、`seasons` の追加（summoner-search-api で使用）

## タスク

- [x] 1. Riot API データ用テーブルの DDL を作成する
  - ファイル: `supabase/migrations/20261105105911_create_summoner_store.sql`
  - `summoners`、`matches`、`match_participants`、`seasons` を design.md の定義どおりに作成する（型・NOT NULL・既定値・PK・FK）
  - インデックス: `summoners(region, riot_id_lower)`、`match_participants(puuid, game_end_at DESC)`、`match_participants(champion_id, team_position)`
  - 4テーブルとも RLS を有効化し、ポリシーは作成しない
  - _要件: 1.1, 3.1, 3.2, 3.3, 3.4, 4.1_

- [x] 2. seasons の初期データの DML を作成する
  - ファイル: `supabase/migrations/20261105105912_insert_seasons.sql`
  - 下表の行を登録する。日時はリージョン差を考慮せず、開始日の 00:00 UTC とする。`end_at` は次シーズンの `start_at`、現行シーズンは NULL
  - _要件: 3.3_

  | id | name | start_at |
  |---|---|---|
  | 2021 | シーズン2021 | 2021-01-08 |
  | 2022 | シーズン2022 | 2022-01-07 |
  | 2023-S1 | 2023 スプリット1 | 2023-01-11 |
  | 2023-S2 | 2023 スプリット2 | 2023-07-19 |
  | 2024-S1 | 2024 スプリット1 | 2024-01-10 |
  | 2024-S2 | 2024 スプリット2 | 2024-05-15 |
  | 2024-S3 | 2024 スプリット3 | 2024-09-25 |
  | 2025-S1 | 2025 シーズン1 | 2025-01-09 |
  | 2025-S2 | 2025 シーズン2 | 2025-04-30 |
  | 2025-S3 | 2025 シーズン3 | 2025-08-27 |
  | 2026-S1 | 2026 シーズン1 | 2026-01-08 |
  | 2026-S2 | 2026 シーズン2 | 2026-04-29 |
  | 2026-S3 | 2026 シーズン3 | 2026-07-29 |

- [x] 3. 既存マイグレーションを冪等にし、`supabase/migrations/README.md` を削除する
  - `20240101`〜`20240104` を design.md の冪等性ルールに合わせて書き換える（適用済みのため DB への再適用は不要）
  - _要件: 1.1_

- [x] 4. チェックポイント: ユーザーが SQL Editor でタスク1・2のファイルを実行し、テーブル・インデックス・RLS・seasons の行を確認する

- [x] 5. failed_matches と flex 勝敗数の DDL を作成する
  - ファイル: `supabase/migrations/20261106000000_add_failed_matches.sql`
  - `failed_matches` を design.md の定義どおりに作成し、RLS を有効化（ポリシーなし）
  - `summoners` に `flex_wins`、`flex_losses`（int NOT NULL DEFAULT 0）を `ADD COLUMN IF NOT EXISTS` で追加
  - _要件: 3.4_

- [x] 6. チェックポイント: ユーザーが SQL Editor でタスク5のファイルを実行する

- [x] 7. ビルド集計・試合詳細用のデータの DDL を作成する（champion-stats で使用）
  - ファイル: `supabase/migrations/<作成時のUTC>_add_match_build_data.sql`（design.md のファイル一覧の予定名を実ファイル名に更新する）
  - `matches` に `patch`、`is_remake`、`detail_version`、`timeline_fetched_at` を追加
  - `match_participants` に `primary_perk_ids`、`sub_perk_ids`、`stat_perk_ids`、`skill_order`、`starting_items`、`completed_items`、`patch`、`is_remake` を追加
  - 既存行の `patch` を `game_version` から埋める（`matches` と `match_participants` の両方。冪等な UPDATE）
  - `match_bans`、`summoner_rank_snapshots` を作成し RLS を有効化（ポリシーなし）
  - インデックス: `match_participants(champion_name, team_position, patch)`、`match_bans(champion_id)`、`summoner_rank_snapshots(puuid, fetched_at DESC)`、`matches` の補完対象抽出用の部分インデックス
  - Storage の非公開バケット `riot-raw` を `storage.buckets` への冪等な INSERT で作成
  - _要件: 3.2, 3.3, 3.4_

- [x] 8. チェックポイント: ユーザーが SQL Editor でタスク7のファイルを実行する

## 注意事項

- シーズン日付の出典: [BoostRoyal](https://boostroyal.com/blog/start-and-end-dates-for-all-league-of-legends-seasons)、2023・2024 のスプリット境界は Riot 公式の [パッチ13.14ノート](https://www.leagueoflegends.com/en-us/news/game-updates/patch-13-14-notes/)・[Split 2 プレビュー](https://www.leagueoflegends.com/en-us/news/dev/split-2-gameplay-preview/) と [GameLeap](https://www.gameleap.com/articles/lol-when-does-ranked-split-2-end-and-split-3-start) で確認済み
- 2021年6月より前の試合は Riot API の試合ID一覧で取得できないが、シーズン2021の行は集計範囲として登録する

- [x] 9. worker_leases の DDL を作成する（aws-migration で使用）
  - ファイル: `supabase/migrations/<作成時のUTC>_create_worker_leases.sql`（design.md のファイル一覧にも追加）
  - design.md の定義どおりに作成し RLS を有効化（ポリシーなし）
  - _要件: 1.1_

- [x] 10. チェックポイント: ユーザーが SQL Editor でタスク9のファイルを実行する

- [x] 11. クローラー用の DDL を作成する（match-crawler で使用）
  - ファイル: `supabase/migrations/<作成時のUTC>_add_match_crawler.sql`（design.md のファイル一覧のファイル名も実際の名前に直す）
  - `crawler_seeds` の作成（RLS 有効、ポリシーなし）、`matches`・`match_participants` に `rank_tier` を追加、インデックス、関数 `prune_crawler_matches`
  - _要件: 1.1_
- [x] 12. チェックポイント: ユーザーが SQL Editor でタスク11のファイルを実行する

- [x] 13. 試合詳細用の DDL を作成する（match-detail で使用）
  - ファイル: `supabase/migrations/<作成時のUTC>_add_match_raw_bundle_key.sql`（design.md のファイル一覧のファイル名も実際の名前に直す）
  - `matches` に `raw_bundle_key text` を追加（`ADD COLUMN IF NOT EXISTS`、`COMMENT ON`）
  - _要件: 1.1_
- [x] 14. チェックポイント: ユーザーが SQL Editor でタスク13のファイルを実行する
