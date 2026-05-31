# Implementation Plan: サモナー検索API

## Overview

`api/summoner/ → services/summoner/ → adapters/riot_api.py` のレイヤー構造に従い、
サモナーのプロフィール・ランク情報・試合履歴・チャンピオン統計を取得するFastAPIバックエンドを実装する。

## Tasks

- [x] 1. 依存関係とスキーマの整備
  - [x] 1.1 `requirements.txt` に `httpx` と `hypothesis` を追加する
    - `httpx` を非同期HTTPクライアントとして追加
    - `hypothesis` をプロパティベーステスト用に追加
    - _Requirements: 1.1, 1.2_

  - [x] 1.2 `schemas/summoner.py` に Pydantic スキーマを実装する
    - `RankData`, `SummonerData`, `MatchData`, `ChampionStatData` を定義
    - 全フィールドに型ヒントを付与
    - _Requirements: 4.3, 4.4, 5.3, 6.2_

- [x] 2. 地域マッピングサービスの実装
  - [x] 2.1 `services/summoner/region.py` を実装する
    - `PLATFORM_MAP`, `REGIONAL_MAP` 定数を定義
    - `get_platform(region: str) -> str` を実装（無効値は HTTP 400）
    - `get_regional(region: str) -> str` を実装（無効値は HTTP 400）
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 2.2 Property 1: 地域マッピングの完全性プロパティテストを書く
    - **Property 1: 地域マッピングの完全性**
    - `sampled_from(["JP","KR","NA","EUW","EUNE","OCE"])` で全有効値を検証
    - `get_platform()` と `get_regional()` が空でない文字列を返すことを確認
    - 最低100イテレーション実行
    - **Validates: Requirements 2.1, 2.2, 2.4**

  - [x] 2.3 Property 2: 無効地域のエラープロパティテストを書く
    - **Property 2: 無効地域のエラー**
    - `text()` で有効値を除外した文字列を生成
    - `get_platform()` と `get_regional()` が HTTP 400 を発生させることを確認
    - 最低100イテレーション実行
    - **Validates: Requirements 2.3**

- [x] 3. 共通エラーハンドラーの実装
  - [x] 3.1 `services/summoner/_error.py` を実装する
    - `handle_riot_error(e: httpx.HTTPStatusError) -> None` を実装
    - 404 → HTTP 404「サモナーが見つかりません」
    - 429 → HTTP 429「レート制限に達しました。しばらく待ってから再試行してください」
    - 5xx → `logger.error()` でログ記録後、HTTP 502「Riot APIが一時的に利用できません」
    - スタックトレースをレスポンスに含めない
    - _Requirements: 3.2, 3.3, 3.4, 8.1, 8.2, 8.3, 8.4_

  - [x] 3.2 Property 3: 5xxエラーの502変換プロパティテストを書く
    - **Property 3: 5xxエラーの502変換**
    - `integers(min_value=500, max_value=599)` で任意の5xxコードを生成
    - `handle_riot_error()` が HTTP 502 を発生させることを確認
    - 最低100イテレーション実行
    - **Validates: Requirements 3.4**

- [x] 4. チェックポイント - 基盤コードの確認
  - 全テストが通ることを確認し、疑問点があればユーザーに確認する。

- [x] 5. プロフィール取得サービスの実装
  - [x] 5.1 `services/summoner/profile.py` を実装する
    - `get_summoner_data(region: str, game_name: str, tag_line: str) -> SummonerData` を実装
    - Regional ホストで `/riot/account/v1/accounts/by-riot-id/{gameName}/{tagLine}` を呼び出し PUUID 取得
    - Platform ホストで `/lol/summoner/v4/summoners/by-puuid/{puuid}` を呼び出しサモナー情報取得
    - `/lol/league/v4/entries/by-summoner/{summonerId}` でランク情報取得
    - ランクデータなし時は `tier: "UNRANKED"`, `rank: ""`, `leaguePoints: 0`, `wins: 0`, `losses: 0` を返す
    - `previousSeasonRank` は常に `"UNRANKED"` を設定
    - `httpx.HTTPStatusError` を `handle_riot_error()` で変換
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.5, 4.6_

  - [x] 5.2 `profile.py` のユニットテストを書く
    - ランクデータなし時の UNRANKED デフォルト値を確認
    - 404/429/5xx エラーの HTTPException 変換を確認
    - _Requirements: 4.5, 3.2, 3.3, 3.4_

- [x] 6. 試合履歴取得サービスの実装
  - [x] 6.1 `services/summoner/matches.py` を実装する
    - `get_matches(region: str, game_name: str, tag_line: str, count: int) -> list[MatchData]` を実装
    - Regional ホストで PUUID 取得
    - `/lol/match/v5/matches/by-puuid/{puuid}/ids?count={count}` で試合 ID リスト取得
    - 各試合 ID に対して `/lol/match/v5/matches/{matchId}` で試合詳細取得（逐次処理）
    - PUUID で参加者データを特定し `MatchData` を組み立て
    - `timeAgoSeconds` を現在 UTC 時刻と試合終了時刻の差分で計算
    - 個別試合の取得失敗は `logger.warning()` でログ記録してスキップ
    - _Requirements: 5.1, 5.4, 5.5, 5.6_

  - [x] 6.2 `matches.py` のユニットテストを書く
    - 試合取得失敗時のスキップ動作を確認
    - `timeAgoSeconds` の計算ロジックを確認
    - _Requirements: 5.4, 5.6_

- [x] 7. チャンピオン統計サービスの実装
  - [x] 7.1 `services/summoner/champion_stats.py` を実装する
    - `get_champion_stats(region: str, game_name: str, tag_line: str) -> list[ChampionStatData]` を実装
    - 直近20試合の `MatchData` を `matches.py` から取得
    - チャンピオン名でグループ化し wins/losses/cs/kda を集計
    - `kda = (kills + assists) / max(deaths, 1)` で計算
    - 総試合数（wins + losses）降順でソート
    - 試合履歴なし時は空リストを返す
    - _Requirements: 6.1, 6.3, 6.4, 6.5, 6.6_

  - [x] 7.2 Property 4: KDA計算のゼロ除算回避プロパティテストを書く
    - **Property 4: KDA計算のゼロ除算回避**
    - `integers(min_value=0)` × 3 で任意の kills/deaths/assists を生成
    - KDA 計算が常に有限の非負数を返すことを確認
    - 最低100イテレーション実行
    - **Validates: Requirements 6.4**

  - [x] 7.3 Property 5: チャンピオン統計のソート順プロパティテストを書く
    - **Property 5: チャンピオン統計のソート順**
    - `lists(builds(MatchData, ...))` で任意の試合リストを生成
    - 結果リストが総試合数（wins + losses）の降順であることを確認
    - 最低100イテレーション実行
    - **Validates: Requirements 6.5**

  - [x] 7.4 `champion_stats.py` のユニットテストを書く
    - 試合履歴なし時の空リスト返却を確認
    - 集計ロジックの正確性を確認
    - _Requirements: 6.3, 6.6_

- [x] 8. チェックポイント - サービス層の確認
  - 全テストが通ることを確認し、疑問点があればユーザーに確認する。

- [x] 9. HTTPルーターの実装
  - [x] 9.1 `api/summoner/__init__.py` と `api/summoner/router.py` を実装する
    - `APIRouter` を作成し prefix `/api/summoner` を設定
    - `GET /{region}/{gameName}/{tagLine}` → `SummonerData` を実装
    - `GET /{region}/{gameName}/{tagLine}/matches` → `list[MatchData]` を実装（`count: int = Query(default=10, ge=1, le=20)`）
    - `GET /{region}/{gameName}/{tagLine}/champion-stats` → `list[ChampionStatData]` を実装
    - `region`: `Literal["JP","KR","NA","EUW","EUNE","OCE"]` でバリデーション
    - `gameName`: `Path(..., min_length=1, max_length=16)` でバリデーション
    - `tagLine`: `Path(..., min_length=1, max_length=5)` でバリデーション
    - URL デコードを正しく処理
    - _Requirements: 4.1, 4.2, 5.1, 5.2, 5.7, 6.1, 7.1, 7.2, 7.3, 9.2_

  - [x] 9.2 Property 6: 入力バリデーションの一貫性プロパティテストを書く
    - **Property 6: 入力バリデーションの一貫性**
    - `text(min_size=17)` で17文字以上の gameName を生成し HTTP 422 を確認
    - `text(min_size=6)` で6文字以上の tagLine を生成し HTTP 422 を確認
    - 許可されていない region 値で HTTP 422 を確認
    - 最低100イテレーション実行
    - **Validates: Requirements 7.1, 7.2, 7.3**

  - [x] 9.3 Property 7: エラーレスポンス形式の一貫性プロパティテストを書く
    - **Property 7: エラーレスポンス形式の一貫性**
    - 各エラー条件（400, 404, 422, 429, 502）をモックで発生させる
    - レスポンスボディが `{"detail": "<message>"}` 形式であることを確認
    - スタックトレースや内部実装詳細が含まれないことを確認
    - 最低100イテレーション実行
    - **Validates: Requirements 8.1, 8.4**

  - [x] 9.4 ルーターのインテグレーションテストを書く
    - `TestClient` を使ったエンドポイント全体の E2E フロー確認（Riot API はモック）
    - 正常系・異常系のレスポンスを確認
    - _Requirements: 4.1, 5.1, 6.1_

- [x] 10. `main.py` へのルーター登録
  - [x] 10.1 `main.py` にサモナールーターを登録する
    - `from api.summoner.router import router as summoner_router` を追加
    - `app.include_router(summoner_router)` を追加
    - _Requirements: 9.1, 9.2_

- [x] 11. 最終チェックポイント - 全テストの確認
  - 全テストが通ることを確認し、疑問点があればユーザーに確認する。

## Notes

- `*` が付いたタスクはオプションであり、MVP を優先する場合はスキップ可能
- 各タスクは対応する要件番号を参照しており、トレーサビリティを確保
- プロパティテストは `hypothesis` を使用し、最低100イテレーション実行（`@settings(max_examples=100)`）
- タグ形式: `# Feature: summoner-search-api, Property {N}: {property_text}`
- `adapters/riot_api.py` は変更なし（既存コードを利用）
- 1ファイル250行以内の制約に従い、必要に応じてサブモジュールに分割

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "3.1"] },
    { "id": 3, "tasks": ["3.2", "5.1"] },
    { "id": 4, "tasks": ["5.2", "6.1"] },
    { "id": 5, "tasks": ["6.2", "7.1"] },
    { "id": 6, "tasks": ["7.2", "7.3", "7.4", "9.1"] },
    { "id": 7, "tasks": ["9.2", "9.3", "9.4", "10.1"] }
  ]
}
```
