# 要件定義書: サモナー検索API

## はじめに

Riot Games APIに接続し、サモナーのプロフィール・ランク情報・試合履歴・チャンピオン統計を取得するバックエンドAPIを実装する。
既存フロントエンド（summoner-search）のモックデータを実際のRiot APIデータに置き換えることが最終目標。

レイヤー構造は `api/summoner/ → services/summoner/ → adapters/riot_api.py` に従う。

## 用語集

- **API_Server**: FastAPIバックエンドサーバー
- **Riot_Adapter**: `backend/adapters/riot_api.py` の非同期HTTPクライアント層
- **Summoner_Service**: `backend/services/summoner/` のビジネスロジック層
- **Summoner_Router**: `backend/api/summoner/` のHTTPルーター層
- **Summoner_Schema**: `backend/schemas/` のPydantic入出力型定義
- **Region**: サーバー地域（JP / KR / NA / EUW / EUNE / OCE）
- **Platform**: Riot APIのプラットフォームホスト（例: jp1, kr, na1）
- **Regional**: Riot APIのリージョナルホスト（例: asia, americas, europe, sea）
- **PUUID**: Riot Gamesが発行するプレイヤー固有ID
- **SummonerId**: プラットフォーム固有のサモナーID
- **RiotId**: `gameName#tagLine` 形式のプレイヤー識別子

---

## 要件

### 要件1: httpx 非同期クライアントの導入

**ユーザーストーリー:** 開発者として、非同期HTTPクライアントを使用したい。そうすることで、FastAPIの非同期処理と整合性を保ちながらRiot APIを呼び出せる。

#### 受け入れ基準

1. THE API_Server SHALL use `httpx` as the HTTP client library for all Riot API requests.
2. WHEN `requirements.txt` is read, THE API_Server SHALL include `httpx` as a dependency.
3. THE Riot_Adapter SHALL expose an `async def get(region: str, path: str) -> dict` function using `httpx.AsyncClient`.

---

### 要件2: 地域マッピング

**ユーザーストーリー:** 開発者として、RegionからPlatformおよびRegionalホストへの変換ロジックを一元管理したい。そうすることで、各エンドポイントで重複した変換コードを書かずに済む。

#### 受け入れ基準

1. THE Summoner_Service SHALL map each Region value to its corresponding Platform host:
   - JP → jp1, KR → kr, NA → na1, EUW → euw1, EUNE → eun1, OCE → oc1
2. THE Summoner_Service SHALL map each Region value to its corresponding Regional host:
   - JP → asia, KR → asia, NA → americas, EUW → europe, EUNE → europe, OCE → sea
3. IF an unsupported Region value is provided, THEN THE Summoner_Service SHALL raise an HTTP 400 error.
4. FOR ALL valid Region values, THE Summoner_Service SHALL return a non-empty Platform string and a non-empty Regional string (round-trip property).

---

### 要件3: アカウント情報取得

**ユーザーストーリー:** 開発者として、RiotId（gameName + tagLine）からPUUIDを取得したい。そうすることで、後続のサモナー情報取得に使用できる。

#### 受け入れ基準

1. WHEN a valid `gameName` and `tagLine` are provided, THE Riot_Adapter SHALL call `https://asia.api.riotgames.com/riot/account/v1/accounts/by-riot-id/{gameName}/{tagLine}` and return the account data.
2. IF the Riot API returns a 404 response, THEN THE Summoner_Service SHALL raise an HTTP 404 error with the message "サモナーが見つかりません".
3. IF the Riot API returns a 429 response, THEN THE Summoner_Service SHALL raise an HTTP 429 error with the message "レート制限に達しました。しばらく待ってから再試行してください".
4. IF the Riot API returns a 5xx response, THEN THE Summoner_Service SHALL raise an HTTP 502 error with the message "Riot APIが一時的に利用できません".

---

### 要件4: サモナープロフィール取得エンドポイント

**ユーザーストーリー:** フロントエンド開発者として、サモナー名・タグライン・リージョンを指定してサモナーのプロフィール情報を取得したい。そうすることで、モックデータを実際のデータに置き換えられる。

#### 受け入れ基準

1. WHEN a GET request is made to `/api/summoner/{region}/{gameName}/{tagLine}`, THE Summoner_Router SHALL return a `SummonerData` response.
2. THE Summoner_Router SHALL accept `region` as a path parameter with valid values: JP, KR, NA, EUW, EUNE, OCE.
3. THE Summoner_Schema SHALL define `SummonerData` with fields: `name: str`, `tagLine: str`, `level: int`, `profileIconId: int`, `rank: RankData`, `previousSeasonRank: str`.
4. THE Summoner_Schema SHALL define `RankData` with fields: `queueType: str`, `tier: str`, `rank: str`, `leaguePoints: int`, `wins: int`, `losses: int`.
5. WHEN a summoner has no ranked data, THE Summoner_Service SHALL return `RankData` with `tier: "UNRANKED"`, `rank: ""`, `leaguePoints: 0`, `wins: 0`, `losses: 0`.
6. THE Summoner_Service SHALL set `previousSeasonRank` to `"UNRANKED"` as a placeholder value.
7. WHEN the `gameName` or `tagLine` contains URL-unsafe characters, THE Summoner_Router SHALL decode them correctly before passing to the service.

---

### 要件5: 試合履歴取得エンドポイント

**ユーザーストーリー:** フロントエンド開発者として、サモナーの直近の試合履歴を取得したい。そうすることで、MatchHistoryコンポーネントに実データを表示できる。

#### 受け入れ基準

1. WHEN a GET request is made to `/api/summoner/{region}/{gameName}/{tagLine}/matches`, THE Summoner_Router SHALL return a list of `MatchData`.
2. THE Summoner_Router SHALL accept an optional query parameter `count` (default: 10, max: 20) to limit the number of matches returned.
3. THE Summoner_Schema SHALL define `MatchData` with fields: `matchId: str`, `isWin: bool`, `gameMode: str`, `championName: str`, `kills: int`, `deaths: int`, `assists: int`, `cs: int`, `gameDurationSeconds: int`, `itemIds: list[int]`, `timeAgoSeconds: int`.
4. THE Summoner_Service SHALL calculate `timeAgoSeconds` as the difference between the current UTC time and the match end time.
5. THE Summoner_Service SHALL extract the target summoner's participant data from the match detail using the PUUID.
6. IF a match detail fetch fails for a single match, THEN THE Summoner_Service SHALL skip that match and continue processing remaining matches.
7. WHEN `count` exceeds 20, THE Summoner_Router SHALL return an HTTP 400 error.

---

### 要件6: チャンピオン統計取得エンドポイント

**ユーザーストーリー:** フロントエンド開発者として、サモナーの直近試合からチャンピオン別の統計を取得したい。そうすることで、ChampionStatsコンポーネントに実データを表示できる。

#### 受け入れ基準

1. WHEN a GET request is made to `/api/summoner/{region}/{gameName}/{tagLine}/champion-stats`, THE Summoner_Router SHALL return a list of `ChampionStatData`.
2. THE Summoner_Schema SHALL define `ChampionStatData` with fields: `championName: str`, `wins: int`, `losses: int`, `cs: float`, `kda: float`.
3. THE Summoner_Service SHALL aggregate `wins`, `losses`, and average `cs` and `kda` from the most recent 20 matches per champion.
4. THE Summoner_Service SHALL calculate `kda` as `(kills + assists) / max(deaths, 1)` to avoid division by zero.
5. THE Summoner_Service SHALL sort the result by total games played (wins + losses) in descending order.
6. WHEN a summoner has no match history, THE Summoner_Router SHALL return an empty list.

---

### 要件7: 入力バリデーション

**ユーザーストーリー:** 開発者として、不正な入力を早期に検出したい。そうすることで、Riot APIへの無駄なリクエストを防ぎ、適切なエラーを返せる。

#### 受け入れ基準

1. WHEN `gameName` is an empty string or exceeds 16 characters, THE Summoner_Router SHALL return an HTTP 422 error.
2. WHEN `tagLine` is an empty string or exceeds 5 characters, THE Summoner_Router SHALL return an HTTP 422 error.
3. THE Summoner_Router SHALL validate `region` against the allowed values (JP, KR, NA, EUW, EUNE, OCE) and return an HTTP 422 error for invalid values.
4. FOR ALL valid inputs, THE Summoner_Router SHALL pass the request to THE Summoner_Service without modification.

---

### 要件8: エラーレスポンス形式

**ユーザーストーリー:** フロントエンド開発者として、一貫したエラーレスポンス形式を受け取りたい。そうすることで、エラーハンドリングを統一的に実装できる。

#### 受け入れ基準

1. THE API_Server SHALL return all error responses in the format `{"detail": "<message>"}`.
2. THE API_Server SHALL use HTTP status codes: 400 (不正なリクエスト), 404 (未検出), 422 (バリデーションエラー), 429 (レート制限), 502 (上流エラー).
3. THE API_Server SHALL log all 5xx errors with the error details using Python's `logging` module.
4. THE API_Server SHALL NOT include stack traces or internal implementation details in error responses.

---

### 要件9: CORS設定

**ユーザーストーリー:** フロントエンド開発者として、ローカル開発環境（localhost:3000）からAPIを呼び出したい。そうすることで、フロントエンドとバックエンドを連携してテストできる。

#### 受け入れ基準

1. WHILE the API_Server is running, THE API_Server SHALL allow CORS requests from origins defined in `settings.cors_origins`.
2. THE API_Server SHALL include the summoner router under the prefix `/api/summoner`.
