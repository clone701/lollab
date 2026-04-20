# 設計書: サモナー検索機能

## 概要

LoL Lab のホーム画面（`/`）にサモナー検索UIを実装する。
検索前はフォームと機能紹介カードを表示し、検索後はサモナープロフィール・対戦履歴・チャンピオン統計の3カラムレイアウトを表示する。
現フェーズではモックデータを使用し、API連携は別スペックで扱う。

## アーキテクチャ

```
app/page.tsx
  └── SearchPageContainer（状態管理）
        ├── SearchPage（検索前）
        └── SearchResultPage（検索後）
```

状態管理は `SearchPageContainer` 内の `useState` で行い、`searchQuery` と `region` を保持する。

```mermaid
graph TD
  A[page.tsx] --> B[SearchPageContainer]
  B --> C{searchQuery?}
  C -- なし --> D[SearchPage]
  C -- あり --> E[SearchResultPage]
  D --> F[SearchForm]
  D --> G[FeatureCard x2]
  F --> H[RegionSelector]
  F --> I[SuggestDropdown]
  E --> J[SummonerProfile]
  E --> K[MatchHistory]
  E --> L[ChampionStats]
  K --> M[MatchCard x N]
  L --> N[ChampionStatRow x N]
```

## コンポーネントとインターフェース

### ファイル構成

```
frontend/src/
├── app/page.tsx
├── components/
│   └── summoner-search/
│       ├── index.ts
│       ├── SearchPageContainer.tsx       # 状態管理（'use client'）
│       ├── SearchPage.tsx                # 検索前画面
│       ├── SearchForm.tsx                # 検索フォーム（'use client'）
│       ├── RegionSelector.tsx            # 地域選択ドロップダウン（'use client'）
│       ├── SuggestDropdown.tsx           # 候補プルダウン
│       ├── FeatureCard.tsx               # 機能紹介カード
│       ├── SearchResultPage.tsx          # 検索後画面
│       ├── SummonerProfile.tsx
│       ├── MatchHistory.tsx
│       ├── MatchCard.tsx
│       ├── ChampionStats.tsx
│       └── ChampionStatRow.tsx
└── types/
    └── summoner.ts
```

### コンポーネントインターフェース

```typescript
// SearchPageContainer: props なし

// SearchPage
interface SearchPageProps {
  onSearch: (query: string, region: Region) => void;
}

// SearchForm
interface SearchFormProps {
  onSearch: (query: string, region: Region) => void;
}

// RegionSelector
interface RegionSelectorProps {
  value: Region;
  onChange: (region: Region) => void;
}

// SuggestDropdown
interface SuggestDropdownProps {
  query: string;
  region: Region;
  onSelect: (candidate: SuggestCandidate) => void;
  onClose: () => void;
  focusedIndex: number;
}

// SearchResultPage
interface SearchResultPageProps {
  query: string;
  region: Region;
  onSearch: (query: string, region: Region) => void;
}
```

## データモデル

```typescript
// types/summoner.ts

export type Region = 'JP' | 'KR' | 'NA' | 'EUW' | 'EUNE' | 'OCE';

export const REGION_DEFAULT_TAGS: Record<Region, string> = {
  JP: 'JP1',
  KR: 'KR1',
  NA: 'NA1',
  EUW: 'EUW',
  EUNE: 'EUNE',
  OCE: 'OCE1',
};

export interface SuggestCandidate {
  name: string;
  tagLine: string;
  region: Region;
}

export interface SummonerData {
  name: string;
  tagLine: string;
  level: number;
  profileIconId: number;
  rank: RankData;
  previousSeasonRank: string;
}

export interface RankData {
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
}

export interface MatchData {
  matchId: string;
  isWin: boolean;
  gameMode: string;
  championName: string;
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  gameDurationSeconds: number;
  itemIds: number[];
  timeAgoSeconds: number;
}

export interface ChampionStatData {
  championName: string;
  wins: number;
  losses: number;
  cs: number;
  kda: number;
}
```

### モックデータ

`lib/summoner-search/mockData.ts` にモックデータを定義する。
サジェスト候補のモックも追加する。

```typescript
// モックサジェスト候補
export const MOCK_SUGGEST_CANDIDATES: SuggestCandidate[] = [
  { name: 'Hide on bush', tagLine: 'KR1', region: 'KR' },
  { name: 'Faker', tagLine: 'KR1', region: 'KR' },
  // ...
];
```

## SearchForm の動作フロー

```
1. ユーザーが入力
2. 1文字以上 → SuggestDropdown を表示（モックデータでフィルタリング）
3. 候補選択 or Enter → onSearch(query, region) を呼び出す
4. フォーカスアウト or Escape → SuggestDropdown を閉じる
```

バリデーション:
- 空文字列 → 検索しない
- 101文字以上 → エラーメッセージ表示
- タグなし（`#` なし）→ 許可（タグはオプション）

## Correctness Properties

### Property 1: 空入力は検索を実行しない
*For any* 空文字列または空白のみの文字列、バリデーション関数は検索を許可しない
**Validates: 要件 3.1**

### Property 2: 101文字以上の入力はバリデーションエラーを返す
*For any* 101文字以上の文字列、バリデーション関数はエラーメッセージを返す
**Validates: 要件 3.4**

### Property 3: タグなし・タグあり両方の有効な入力はバリデーションを通過する
*For any* 1〜100文字の非空文字列（`#` の有無を問わない）、バリデーション関数は成功を返す
**Validates: 要件 3.2, 3.3**

### Property 4: SuggestDropdown はクエリにマッチする候補のみ表示する
*For any* 入力クエリ、SuggestDropdown に表示される候補は全てクエリを名前に含む
**Validates: 要件 4.2**

### Property 5〜8: （既存のコンポーネント表示プロパティは変更なし）
SummonerProfile・MatchCard・ChampionStatRow の表示プロパティは既存仕様を維持する。

## エラーハンドリング

| 条件 | 表示メッセージ |
|------|--------------|
| 空入力で検索 | 検索を実行しない（メッセージなし） |
| 101文字以上の入力 | 「入力が長すぎます」 |

## テスト戦略

### プロパティベーステスト（fast-check）

| Property | テスト対象 | 生成する入力 |
|----------|-----------|------------|
| P1 | `validateSummonerName` | 空文字列・空白文字列 |
| P2 | `validateSummonerName` | 101文字以上の文字列 |
| P3 | `validateSummonerName` | 1〜100文字の任意文字列 |
| P4 | `filterSuggestions` | 任意のクエリ文字列 |
| P5〜P8 | 各コンポーネント render | 既存と同様 |
