# 実装計画: サモナー検索機能（改修）

## 概要

既存のサモナー検索UIを改修する。
- 地域セレクター（RegionSelector）を追加
- タグなしでも検索可能にバリデーションを変更
- 入力中に候補プレイヤーをプルダウン表示（SuggestDropdown）

## タスク

- [x] 1. 型定義・バリデーション・モックデータの更新
  - [x] 1.1 `frontend/src/types/summoner.ts` に `Region`, `REGION_DEFAULT_TAGS`, `SuggestCandidate` を追加する
    - _要件: 2.1, 2.2, 4.2_
  - [x] 1.2 `frontend/src/lib/summoner-search/validateSummonerName.ts` を更新する
    - `#` なしを許可し、空入力・101文字以上のみエラーとする
    - _要件: 3.1, 3.2, 3.3, 3.4_
  - [x] 1.3 Property 1: 空文字列・空白文字列はバリデーションを通過しないことを検証するプロパティテストを更新する
    - **Property 1: 空入力は検索を実行しない**
    - **Validates: 要件 3.1**
  - [x] 1.4 Property 2: 101文字以上の文字列はエラーを返すことを検証するプロパティテストを更新する
    - **Property 2: 101文字以上の入力はバリデーションエラーを返す**
    - **Validates: 要件 3.4**
  - [x] 1.5 Property 3: 1〜100文字の任意文字列（タグあり・なし両方）はバリデーションを通過することを検証するプロパティテストを書く
    - **Property 3: タグなし・タグあり両方の有効な入力はバリデーションを通過する**
    - **Validates: 要件 3.2, 3.3**
  - [x] 1.6 `frontend/src/lib/summoner-search/mockData.ts` に `MOCK_SUGGEST_CANDIDATES` を追加する
    - _要件: 4.5_
  - [x] 1.7 `frontend/src/lib/summoner-search/filterSuggestions.ts` にサジェストフィルタリング純粋関数を実装する
    - クエリ文字列でサモナー名を前方一致フィルタリングする
    - _要件: 4.2_
  - [x] 1.8 Property 4: 任意のクエリに対してフィルタ結果が全てクエリを含むことを検証するプロパティテストを書く
    - **Property 4: SuggestDropdown はクエリにマッチする候補のみ表示する**
    - **Validates: 要件 4.2**
  - [x] 1.9 `frontend/src/lib/summoner-search/index.ts` を更新して新規エクスポートを追加する

- [x] 2. RegionSelector コンポーネントの実装
  - [x] 2.1 `frontend/src/components/summoner-search/RegionSelector.tsx` を実装する（`'use client'`）
    - JP・KR・NA・EUW・EUNE・OCE の選択肢、選択中地域をバッジ表示
    - _要件: 2.1, 2.2, 2.3_

- [x] 3. SuggestDropdown コンポーネントの実装
  - [x] 3.1 `frontend/src/components/summoner-search/SuggestDropdown.tsx` を実装する
    - 候補リスト表示（サモナー名・タグライン・地域）、キーボードナビゲーション対応
    - _要件: 4.2, 4.3, 5.2, 5.3, 5.4_

- [x] 4. SearchForm の改修
  - [x] 4.1 `frontend/src/components/summoner-search/SearchForm.tsx` を改修する（`'use client'`）
    - RegionSelector を左側に配置、SuggestDropdown を統合
    - タグなし検索対応、プレースホルダーを地域連動に変更
    - キーボード操作（↑↓Enter Escape）対応
    - _要件: 1.3, 1.4, 1.5, 1.6, 3.1〜3.4, 4.1〜4.5, 5.1〜5.4_

- [x] 5. SearchPageContainer・SearchPage の更新
  - [x] 5.1 `frontend/src/components/summoner-search/SearchPageContainer.tsx` を更新する
    - `region` 状態を追加し `onSearch(query, region)` シグネチャに対応する
    - _要件: 2.2_
  - [x] 5.2 `frontend/src/components/summoner-search/SearchPage.tsx` を更新する
    - `onSearch(query, region)` シグネチャに対応する

- [x] 6. 最終チェックポイント - 全テスト通過確認
  - 全テストが通ることを確認し、疑問点があればユーザーに確認する。

## 備考

- 既存の要件5〜10（検索結果画面）は変更なし
- プロパティテストは fast-check を使用し、最低100回イテレーション
- SuggestDropdown は現フェーズでモックデータを使用（API連携は別スペック）
