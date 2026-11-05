# 実装計画: サモナー検索API

## 概要

検索を DB から返す方式に変更し、手動更新と Backfill を追加する。参照: `requirements.md`、`design.md`、`../database/design.md`。

- 前提: database Spec のタスク1〜4が完了し、テーブルが本番 DB に作成済みであること
- 旧方式（検索ごとに Riot API を呼ぶ方式）の実装は完了済み。旧タスクは git 履歴を参照

## タスク

- [x] 1. adapters 層
  - [x] 1.1 `adapters/riot_api.py` を `httpx.AsyncClient` の使い回しに変更し、`main.py` の lifespan で close する
    - _要件: 3.6_
  - [x] 1.2 `schemas/summoner_store.py` に adapters 層の入出力モデルを定義する（`SummonerRecord`、`BackfillState`、`MatchRecord`、`ParticipantRecord`、`ParticipationRecord`、`SeasonRecord`）
    - カラムは database Spec の design.md に一致させる
    - _要件: 4.1_
  - [x] 1.3 `adapters/summoner_store.py` を実装する（design.md のシグネチャどおり。Supabase 呼び出しは `asyncio.to_thread`）
    - `save_matches` は upsert で冪等にする
    - `try_start_backfill` は `backfill_started_at` が10分以内なら False
    - _要件: 4.1, 4.2, 11.2_

- [x] 2. Riot API 取得
  - [x] 2.1 `services/summoner/riot_fetch.py` を実装する
    - `fetch_ranked_match_ids` は `type=ranked` を付け、`start` / `count`（最大100）/ `startTime` / `endTime` を渡せるようにする
    - `fetch_match_details` は `asyncio.Semaphore(10)` で並列取得し、`match_participants` の全カラムを10人分変換する。429 は呼び出し元に伝え、それ以外の個別失敗はログに記録してスキップする
    - 既存の `rank_position.py` の順位算出ロジックを `fetch_profile` から使う
    - _要件: 3.2, 3.3, 4.1, 6.3_
  - [x] 2.2 `riot_fetch.py` のユニットテストを書く（試合詳細から ParticipantRecord への変換、429 の伝播、個別失敗のスキップ）

- [x] 3. 応答組み立て
  - [x] 3.1 `schemas/summoner.py` に `SummonerData.lastUpdatedAt` と `SummonerDetail` を追加する
    - _要件: 5.1_
  - [x] 3.2 `services/summoner/detail.py` を実装する
    - 試合履歴: `get_recent_participations(puuid, 20)`。`timeAgoSeconds` は応答時に計算
    - チャンピオン統計: `get_current_season()` の期間で `get_participations_between()` を呼び `aggregate_champion_stats` で集計。現行シーズン未登録なら全期間
    - _要件: 5.1, 5.2, 5.3, 6.1, 6.2, 7.1〜7.4_

- [x] 4. 検索・更新・Backfill
  - [x] 4.1 `services/summoner/search.py` を実装する（登録済みなら DB のみ、未登録なら初回登録。PUUID 重複時は RiotId を更新）
    - _要件: 1.2, 1.4, 2.1, 2.3, 2.4, 2.5_
  - [x] 4.2 `services/summoner/update.py` を実装する（同期部分。エラー時は保存済み試合を残し `last_updated_at` を変えない）
    - _要件: 3.1, 3.2, 3.3, 3.7, 3.8_
  - [x] 4.3 `services/summoner/backfill.py` を実装する（design.md の「Backfill」の処理順・カーソル更新に従う。例外を外に出さない）
    - _要件: 2.2, 3.4, 3.5, 3.6_
  - [x] 4.4 search / update のユニットテストを書く（登録済みで Riot API を呼ばない、保存済み試合の詳細を取得しない、エラー時に `last_updated_at` 不変）
  - [x] 4.5 backfill のテストを書く
    - プロパティ: 任意の試合ID列と保存済み集合に対し、取得するのは未保存分だけ
    - 429 で終了しカーソルが保存済みページまでしか進まない / 再実行で続きから取得 / 10分以内は開始しない

- [x] 5. ルーター
  - [x] 5.1 `api/summoner/router.py` を GET 検索・POST 更新の2エンドポイントに変更する。初回登録時と更新時は `BackgroundTasks` で `run_backfill` を登録する
    - `/matches`、`/champion-stats`、`/rank-position` を削除
    - _要件: 1.1, 3.1, 9.1〜9.3, 10.1〜10.3_
  - [x] 5.2 不要になった `services/summoner/profile.py`、`matches.py` と、`rank_position.py` のファサード関数、対応する旧テストを削除する
  - [x] 5.3 ルーターのテストを2エンドポイントに合わせて更新する（入力検証 422、エラー形式）

- [x] 6. チェックポイント: バックエンドの全テスト・lint（black, isort, flake8, mypy）が通ることを確認する

- [x] 7. フロントエンド
  - [x] 7.1 `types/summoner.ts` に `lastUpdatedAt` と `SummonerDetail` を追加する
  - [x] 7.2 `lib/api/summoner.ts` を `fetchSummonerDetail` / `updateSummoner` に置き換える
  - [x] 7.3 `formatTimeAgo` を `lib/summoner-search/formatTimeAgo.ts` に切り出し、`MatchCard` から import する。境界値のテストを書く
  - [x] 7.4 `lib/hooks/useSummonerDetail.tsx` を実装する
    - _要件: 8.3_
  - [x] 7.5 `UpdateButton.tsx` を作成し `SummonerProfile` に配置する。テストを書く（更新中の無効化表示）
    - _要件: 8.1, 8.2, 8.4_
  - [x] 7.6 `SearchResultPage.tsx` を `useSummonerDetail` を使う形に変更し、セクション個別のローディング表示を削除する
    - _要件: 8.3_

- [x] 8. 最終チェックポイント: フロントエンドの type-check・lint・テストが通ることを確認し、ローカルで検索・更新を動作確認する

## 追加タスク: リクエスト削減・取りこぼし防止・レート制限

前提: database Spec のタスク5（failed_matches、flex 勝敗数）のマイグレーションファイルが作成済みであること（本番適用はユーザーが行う）

- [x] 9. レート制限
  - [x] 9.1 `config.py` に `riot_rate_limit_per_second`（20）、`riot_rate_limit_per_2min`（100）、`riot_backfill_reserve`（30）を追加する
  - [x] 9.2 `adapters/riot_rate_limiter.py` を実装し、`riot_api.get()` に `priority` を追加する（design.md「レート制限」）
    - _要件: 9.1〜9.5_
  - [x] 9.3 Backfill から呼ぶ取得処理に `priority="backfill"` を渡す
  - [x] 9.4 テスト: 1秒上限で待機する / 2分上限で interactive は即 RiotRateLimitError / backfill は残り30未満で RiotRateLimitError / ホストごとに独立して数える

- [x] 10. 更新時の変更検知
  - [x] 10.1 `schemas/summoner_store.py` の `SummonerRecord` に `flex_wins`、`flex_losses` を追加し、プロフィール取得時に保存する
  - [x] 10.2 `fetch_profile` から league entries の取得を分離し、取得済みエントリを渡せるようにする
  - [x] 10.3 `update.py`: league entries を先に取得し、ソロ+フレックスの勝敗数合計が同じなら `last_updated_at` だけ更新して返す。Backfill は `backfill_completed` が false のときだけ開始する
    - _要件: 3.2〜3.4_
  - [x] 10.4 テスト: 合計が同じなら Riot API 呼び出しは1回 / 異なれば従来の処理 / フレックス未参加（エントリなし）は0として扱う

- [x] 11. Backfill の取りこぼし防止
  - [x] 11.1 `adapters/failed_match_store.py` に failed_matches の操作（失敗の記録と attempts 加算・3回で gave_up、gave_up 済み ID の取得、成功時の削除）を追加する
  - [x] 11.2 `fetch_match_details` が失敗した match ID も返すようにする
  - [x] 11.3 `backfill.py` を design.md「取得失敗した試合の扱い」に従って変更する
    - _要件: 3.7, 3.8_
  - [x] 11.4 テスト: 失敗した試合があるとカーソルがその手前で止まる / 再実行で取り直す / 3回失敗で gave_up になり先へ進む / 成功で failed_matches から消える / 最後のページに失敗があると completed にならない

- [x] 12. フロントエンド
  - [x] 12.1 検索・更新がレート制限で失敗したとき、API の detail（「レート制限に達しました。…」）が画面に表示されることをテストで確認する
    - _要件: 8.5_

- [x] 13. チェックポイント: バックエンド・フロントエンドの全テスト・lint を通す

- [x] 14. レート制限の調整
  - [x] 14.1 `config.py` の既定値を `riot_rate_limit_per_second = 18`、`riot_rate_limit_per_2min = 95` にする
  - [x] 14.2 `adapters/riot_api.py`: `interactive` で 429 を受け、`Retry-After` が2秒以内なら待って1回だけ再送する（再送もレート制限のカウント対象）
    - _要件: 9.3_
  - [x] 14.3 テスト: Retry-After 1 で再送して成功 / Retry-After なし・3秒・backfill では再送しない / 再送後も429なら例外
