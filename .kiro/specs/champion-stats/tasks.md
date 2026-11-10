# 実装計画: チャンピオンビルド

## 概要

参照: `requirements.md`、`design.md`、`../database/design.md`、`../summoner-search-api/design.md`（試合データの取り込み）

前提: database Spec タスク7〜8、summoner-search-api タスク15〜19 が完了していること（集計に使う列がないと値が出ない）

## タスク

- [x] 1. バックエンド: 集計
  - [x] 1.1 `schemas/champion.py` に design.md のスキーマを定義する
  - [x] 1.2 `services/champion/skill_priority.py` と `services/champion/aggregate.py`（純粋関数）を実装する
  - [x] 1.3 テスト: aggregate のプロパティ（試合数の合計・降順・最高勝率の選び方）、スキル優先順の典型例
    - _要件: 3.1〜3.6_

- [x] 2. バックエンド: データ取得と API
  - [x] 2.1 `adapters/champion_stats_store.py`（必要な列だけをページ単位で取得、リメイク除外）
  - [x] 2.2 `services/champion/build.py`（期間・キューの絞り込み、最新パッチ、ロール省略時の最多ロール、概要の値）
  - [x] 2.3 `api/champion/router.py` を作成し `main.py` に登録する
  - [x] 2.4 テスト: 絞り込み、ロールの既定値、試合数0、入力検証 422、エラー形式
    - _要件: 2.1〜2.3, 4.1〜4.4, 5.1, 5.2_

- [x] 3. チェックポイント: バックエンドの全テスト・lint を通し、ローカルで API を呼んで値が返ることを確認する

- [x] 4. フロントエンド: チャンピオン検索
  - [x] 4.1 `components/champion-build/ChampionSearchGrid.tsx`（日本語名・読み・英語 ID で絞り込み）
  - [x] 4.2 `app/champion/page.tsx` を検索画面に置き換える
  - [x] 4.3 テスト: 絞り込み、選択でビルド画面へ遷移
    - _要件: 1.1〜1.4_

- [x] 5. フロントエンド: ビルド画面
  - [x] 5.1 `types/championBuild.ts`、`adapters/api/championBuild.ts`、`lib/champion-build/`（勝率計算、最高勝率/最多の選択、期間・キューの定数）
  - [x] 5.2 `ChampionBuildHeader`、`BuildFilters`（URL クエリと同期）
  - [x] 5.3 `SkillPanel`、`SpellPanel`、`ItemPanel`、`RunePanel`、`OptionStat`
  - [x] 5.4 `app/champion/[championName]/page.tsx`
  - [x] 5.5 テスト: 最高勝率/最多の切り替え、データなし表示、URL クエリの反映
    - _要件: 2.1〜2.3, 3.1〜3.6, 4.1〜4.3_

- [x] 6. 最終チェックポイント: フロントエンドの type-check・lint・テスト・build を通し、ローカルで検索からビルド表示まで確認する

- [x] 8. 最高勝率ビルドの廃止と、集計の条件の並び替え（#142）
  - [x] 8.1 backend: `best_win_rate` を削除
  - [x] 8.2 frontend: 最多ビルドだけにする、「ビルドの集計」カード（期間・キューのボタン、ランク帯、ロール、概要の値）、スペルの上位2件と採用率、ルーンの1番目/2番目の切り替え
  - [x] 8.3 テスト: design.md のテスト方針の「フロントエンド（#142）」
    - _要件: 3.1, 3.7, 3.8, 4.1, 4.2, 4.7_
