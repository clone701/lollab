# 実装計画: 試合詳細

## 概要

参照: `requirements.md`、`design.md`、`../database/design.md`（matches.raw_bundle_key）、`../match-crawler/design.md`（生データのまとめ保存）、`../champion-stats/design.md`（ビルドページの URL）

前提: database Spec タスク13〜14 が完了していること（`raw_bundle_key` がないとクローラーの保存が失敗する）

## タスク

- [x] 1. バックエンド: 生データの読み出し
  - [x] 1.1 `MatchRecord.raw_bundle_key` を追加し（None は書き込まない）、クローラーが保存時に起動のまとめファイルのキーを書く
  - [x] 1.2 `raw_bundle_store.find_in_bundle`（行ごとに展開して探す）と `summoner_store.get_raw_bundle_key`
  - [x] 1.3 `services/match/raw_source.py`（1試合1ファイル → まとめファイル（見つかれば1試合1ファイルに保存）→ Riot API、タイムラインだけの取り直し）
  - [x] 1.4 テスト: design.md のテスト方針の `raw_source.py`・`find_in_bundle`・クローラーの項目
    - _要件: 4.1〜4.3, 5.2_

- [x] 2. バックエンド: 組み立てと API
  - [x] 2.1 `schemas/match_detail.py`
  - [x] 2.2 `services/match/convert.py`、`services/match/build_timeline.py`（純粋関数）
  - [x] 2.3 `adapters/match_rank_store.py`
  - [x] 2.4 `services/match/detail.py`、`api/match/router.py`（`require_allowed_user`、422・404・429・502、Cache-Control）、`main.py` に登録
  - [x] 2.5 サモナー検索の応答（`SummonerData`）に `puuid` を追加
  - [x] 2.6 テスト: design.md のテスト方針の `convert.py`・`build_timeline.py`・`match_rank_store`・router の項目
    - _要件: 2.2〜2.8, 3.2〜3.3, 4.4, 4.5, 5.1, 5.2_

- [x] 3. チェックポイント: バックエンドの全テスト・lint・mypy を通し、ローカルで保存済みの試合（1試合1ファイル・クローラーの試合）の API を呼んで値が返ることを確認する

- [x] 4. フロントエンド: 取得と展開
  - [x] 4.1 `types/matchDetail.ts`、`adapters/api/matchDetail.ts`、`types/summoner.ts` の `puuid`
  - [x] 4.2 `useMatchDetail`（SearchResultPage 内の Context キャッシュ）、`MatchDetailPanel`（読み込み中・エラーと再試行・タブ）
  - [x] 4.3 `MatchCard` の展開ボタン（`aria-expanded`、向きの切り替え）
  - [x] 4.4 テスト: 展開と折りたたみ・キャッシュ・読み込み中・エラーと再試行
    - _要件: 1.1〜1.6, 4.5_

- [x] 5. フロントエンド: 概要タブ
  - [x] 5.1 `lib/match-detail/`（KDA の比率・キル関与率の表示・分あたり CS・ダメージの割合）
  - [x] 5.2 `OverviewTab`、`TeamTable`、`ParticipantRow`、`DamageBar`、`TeamComparison`
  - [x] 5.3 チャンピオンのアイコンのリンク（ビルドページ、ロール付き）
  - [x] 5.4 テスト: 対象プレイヤーの強調、`0/10/2 (20%)` の形式、Perfect、ランクの有無、リンク先
    - _要件: 2.1〜2.8, 2.10_

- [x] 6. フロントエンド: ビルドタブ
  - [x] 6.1 `BuildTab`、`PlayerSelector`、`ItemTimeline`、`SkillOrderView`、`RuneTreeView`
  - [x] 6.2 テスト: 初期表示が対象プレイヤー、切り替え、データなし、選んだルーンの強調
    - _要件: 3.1〜3.4, 4.3_

- [x] 7. フロントエンド: サモナー検索の URL
  - [x] 7.1 トップページがクエリ `region`・`q` を読んで検索結果を表示し、検索時にクエリを更新する（`useSearchParams` を `Suspense` で囲む）
  - [x] 7.2 試合詳細のサモナー名を `/?region=...&q=...` へのリンクにする
  - [x] 7.3 テスト: クエリでの表示、検索でのクエリ更新、リンク先
    - _要件: 2.9_

- [x] 8. チェックポイント: フロントエンドの type-check・lint・format-check・テスト・build を通し、ローカルで展開から両タブ・リンクまで確認する

- [x] 9. デプロイと確認（po とユーザー）
  - [x] 9.1 `main` にマージしてデプロイし、検索の試合とクローラーの試合の両方で試合詳細を開く
  - [x] 9.2 生データがある試合で3秒以内に表示されることを確認する
    - _要件: 4.6_
