# ユビキタス言語定義

## ドメイン用語の定義

### League of Legends関連用語

#### **Summoner (サモナー)**
- **定義**: League of Legendsのプレイヤーアカウント
- **英語**: Summoner
- **日本語**: サモナー
- **コード**: `summoner`, `SummonerProfile`
- **説明**: ゲーム内でのプレイヤーの識別子。レベル、ランク、試合履歴などの情報を持つ

#### **Champion (チャンピオン)**
- **定義**: League of Legendsでプレイ可能なキャラクター
- **英語**: Champion
- **日本語**: チャンピオン
- **コード**: `champion`, `ChampionData`
- **説明**: ゲーム内で操作するキャラクター。それぞれ固有のスキルと特性を持つ

#### **Matchup (マッチアップ)**
- **定義**: 特定のチャンピオン同士の対戦組み合わせ
- **英語**: Matchup
- **日本語**: マッチアップ、対戦組み合わせ
- **コード**: `matchup`, `ChampionMatchup`
- **説明**: 自分のチャンピオンと相手のチャンピオンの組み合わせ。戦略の基本単位

#### **Rank (ランク)**
- **定義**: プレイヤーの競技レベルを示す階級
- **英語**: Rank, Tier
- **日本語**: ランク、ティア
- **コード**: `rank`, `RankInfo`
- **階級**: Iron → Bronze → Silver → Gold → Platinum → Diamond → Master → Grandmaster → Challenger

#### **Region (リージョン)**
- **定義**: サーバーの地理的区分
- **英語**: Region
- **日本語**: リージョン、地域
- **コード**: `region`, `Region`
- **例**: NA (North America), EUW (Europe West), KR (Korea), JP (Japan)

#### **Match History (試合履歴)**
- **定義**: プレイヤーの過去の試合記録
- **英語**: Match History
- **日本語**: 試合履歴、戦績
- **コード**: `matchHistory`, `MatchData`
- **内容**: チャンピオン、KDA、CS、ダメージ、勝敗など

#### **KDA**
- **定義**: Kill/Death/Assist の略。試合での戦闘成績
- **英語**: KDA (Kills/Deaths/Assists)
- **日本語**: KDA、キル/デス/アシスト
- **コード**: `kda`, `KDAStats`
- **計算**: (Kills + Assists) / Deaths

#### **CS (Creep Score)**
- **定義**: ミニオンやモンスターを倒した数
- **英語**: CS, Creep Score
- **日本語**: CS、ミニオン撃破数
- **コード**: `cs`, `creepScore`
- **説明**: 経済力の指標となる重要な数値

#### **Runes (ルーン)**
- **定義**: チャンピオンに追加効果を与える設定システム
- **英語**: Runes
- **日本語**: ルーン
- **コード**: `runes`, `RuneConfiguration`
- **構成**: メインツリー、サブツリー、シャードの組み合わせ

#### **Summoner Spells (サモナースペル)**
- **定義**: 試合中に使用できる特殊スキル
- **英語**: Summoner Spells
- **日本語**: サモナースペル
- **コード**: `spells`, `SummonerSpell`
- **例**: Flash, Ignite, Teleport, Heal

#### **Items (アイテム)**
- **定義**: チャンピオンの能力を強化する装備品
- **英語**: Items
- **日本語**: アイテム
- **コード**: `items`, `Item`
- **分類**: 開始アイテム、コアアイテム、完成アイテム

### アプリケーション固有用語

#### **Note (ノート)**
- **定義**: ユーザーが作成するチャンピオン戦略記録
- **英語**: Note, Champion Note
- **日本語**: ノート、戦略ノート
- **コード**: `note`, `ChampionNote`
- **内容**: マッチアップ、ルーン、スペル、アイテム、戦略メモ

#### **Strategy Memo (戦略メモ)**
- **定義**: ノート内のテキスト形式戦略記録
- **英語**: Strategy Memo, Memo
- **日本語**: 戦略メモ、メモ
- **コード**: `memo`, `strategyMemo`
- **説明**: 自由形式のテキストで記録する戦略情報

#### **User Profile (ユーザープロフィール)**
- **定義**: アプリケーション利用者の情報
- **英語**: User Profile
- **日本語**: ユーザープロフィール
- **コード**: `user`, `UserProfile`
- **内容**: ID、メール、名前、認証情報

#### **Search History (検索履歴)**
- **定義**: ユーザーの過去の検索記録
- **英語**: Search History
- **日本語**: 検索履歴
- **コード**: `searchHistory`, `RecentSearches`
- **保存場所**: ローカルストレージ

#### **Pinned Champions (ピン留めチャンピオン)**
- **定義**: ユーザーがお気に入り登録したチャンピオン
- **英語**: Pinned Champions, Favorite Champions
- **日本語**: ピン留めチャンピオン、お気に入りチャンピオン
- **コード**: `pinnedChampions`, `favoriteChampions`
- **保存場所**: ローカルストレージ

## ビジネス用語の定義

### 機能領域

#### **Summoner Analysis (サモナー分析)**
- **定義**: 対戦相手の戦績・傾向分析機能
- **英語**: Summoner Analysis
- **日本語**: サモナー分析
- **コード**: `summonerAnalysis`
- **目的**: 対戦準備のための情報収集

#### **Note Management (ノート管理)**
- **定義**: 戦略ノートの作成・編集・検索機能
- **英語**: Note Management
- **日本語**: ノート管理
- **コード**: `noteManagement`
- **目的**: 戦略知識の蓄積と活用

#### **Data Persistence (データ永続化)**
- **定義**: ユーザーデータの保存・取得機能
- **英語**: Data Persistence
- **日本語**: データ永続化
- **コード**: `dataPersistence`
- **目的**: セッション間でのデータ維持

### ユーザー分類

#### **Competitive Player (競技志向プレイヤー)**
- **定義**: ランク上昇を目指すプレイヤー
- **英語**: Competitive Player
- **日本語**: 競技志向プレイヤー
- **特徴**: 戦略分析、スキル向上に積極的

#### **Casual Player (カジュアルプレイヤー)**
- **定義**: 楽しみを重視するプレイヤー
- **英語**: Casual Player
- **日本語**: カジュアルプレイヤー
- **特徴**: 気軽な利用、簡単な操作を好む

#### **Learning-Oriented Player (学習志向プレイヤー)**
- **定義**: 知識習得を重視するプレイヤー
- **英語**: Learning-Oriented Player
- **日本語**: 学習志向プレイヤー
- **特徴**: 詳細な記録、体系的な学習

### 品質指標

#### **User Retention (ユーザー継続率)**
- **定義**: 一定期間内にアプリを継続利用するユーザーの割合
- **英語**: User Retention
- **日本語**: ユーザー継続率
- **計算**: 継続ユーザー数 / 総ユーザー数 × 100

#### **Feature Adoption (機能利用率)**
- **定義**: 特定機能を利用するユーザーの割合
- **英語**: Feature Adoption
- **日本語**: 機能利用率
- **計算**: 機能利用ユーザー数 / 総ユーザー数 × 100

#### **Response Time (応答時間)**
- **定義**: APIリクエストから応答までの時間
- **英語**: Response Time
- **日本語**: 応答時間、レスポンス時間
- **単位**: ミリ秒 (ms)、秒 (s)

## UI/UX用語の定義

### インターフェース要素

#### **Search Bar (検索バー)**
- **定義**: サモナー名とリージョンを入力する検索フォーム
- **英語**: Search Bar
- **日本語**: 検索バー
- **コード**: `SearchBar`
- **機能**: 入力検証、オートコンプリート

#### **Profile Card (プロフィールカード)**
- **定義**: サモナー情報を表示するカード型UI
- **英語**: Profile Card
- **日本語**: プロフィールカード
- **コード**: `SummonerProfile`
- **内容**: アイコン、名前、レベル、ランク

#### **Match History Table (試合履歴テーブル)**
- **定義**: 試合データを表形式で表示するコンポーネント
- **英語**: Match History Table
- **日本語**: 試合履歴テーブル
- **コード**: `MatchHistory`
- **機能**: ソート、フィルタリング、ページネーション

#### **Note Editor (ノートエディター)**
- **定義**: ノート作成・編集用のフォームUI
- **英語**: Note Editor
- **日本語**: ノートエディター
- **コード**: `NoteEditor`
- **機能**: チャンピオン選択、ルーン設定、メモ入力

#### **Filter Panel (フィルターパネル)**
- **定義**: 検索条件を設定するUI
- **英語**: Filter Panel
- **日本語**: フィルターパネル
- **コード**: `NoteFilters`
- **機能**: チャンピオン絞り込み、日付範囲指定

### ユーザー体験

#### **Loading State (ローディング状態)**
- **定義**: データ取得中のUI状態
- **英語**: Loading State
- **日本語**: ローディング状態
- **コード**: `LoadingSpinner`
- **表示**: スピナー、スケルトンスクリーン

#### **Error State (エラー状態)**
- **定義**: エラー発生時のUI状態
- **英語**: Error State
- **日本語**: エラー状態
- **コード**: `ErrorBoundary`
- **表示**: エラーメッセージ、再試行ボタン

#### **Empty State (空状態)**
- **定義**: データが存在しない時のUI状態
- **英語**: Empty State
- **日本語**: 空状態、データなし状態
- **表示**: 説明メッセージ、アクション提案

#### **Toast Notification (トースト通知)**
- **定義**: 一時的な通知メッセージ
- **英語**: Toast Notification
- **日本語**: トースト通知
- **コード**: `Toast`
- **種類**: 成功、エラー、警告、情報

## 英語・日本語対応表

### 基本用語
| 英語 | 日本語 | コード表記 |
|------|--------|-----------|
| Summoner | サモナー | summoner |
| Champion | チャンピオン | champion |
| Match | 試合、マッチ | match |
| Rank | ランク | rank |
| Region | リージョン | region |
| Note | ノート | note |
| Strategy | 戦略 | strategy |
| Analysis | 分析 | analysis |
| Profile | プロフィール | profile |
| History | 履歴 | history |

### 機能用語
| 英語 | 日本語 | コード表記 |
|------|--------|-----------|
| Search | 検索 | search |
| Filter | フィルター | filter |
| Sort | ソート | sort |
| Create | 作成 | create |
| Edit | 編集 | edit |
| Delete | 削除 | delete |
| Save | 保存 | save |
| Load | 読み込み | load |
| Cache | キャッシュ | cache |
| Sync | 同期 | sync |

### UI用語
| 英語 | 日本語 | コード表記 |
|------|--------|-----------|
| Button | ボタン | button |
| Input | 入力 | input |
| Form | フォーム | form |
| Table | テーブル | table |
| Card | カード | card |
| Modal | モーダル | modal |
| Dropdown | ドロップダウン | dropdown |
| Tab | タブ | tab |
| Panel | パネル | panel |
| Header | ヘッダー | header |

### 状態用語
| 英語 | 日本語 | コード表記 |
|------|--------|-----------|
| Loading | 読み込み中 | loading |
| Success | 成功 | success |
| Error | エラー | error |
| Pending | 保留中 | pending |
| Active | アクティブ | active |
| Inactive | 非アクティブ | inactive |
| Valid | 有効 | valid |
| Invalid | 無効 | invalid |
| Available | 利用可能 | available |
| Unavailable | 利用不可 | unavailable |

## コード上の命名規則

### TypeScript/JavaScript

#### インターフェース・型定義
```typescript
// ドメインオブジェクト: PascalCase
interface SummonerProfile {
  id: string;
  name: string;
  level: number;
  rank?: RankInfo;
}

interface ChampionNote {
  id: number;
  userId: string;
  myChampionId: string;
  enemyChampionId: string;
  runes: RuneConfiguration;
  spells: SummonerSpell[];
  items: Item[];
  memo: string;
  createdAt: Date;
  updatedAt: Date;
}

// API関連: PascalCase + Request/Response suffix
interface CreateNoteRequest {
  myChampionId: string;
  enemyChampionId: string;
  memo: string;
}

interface SummonerSearchResponse {
  summoner: SummonerProfile;
  matches: MatchData[];
}
```

#### 関数・変数
```typescript
// 関数: camelCase, 動詞 + 名詞
const fetchSummonerProfile = async (region: string, name: string) => {};
const createChampionNote = async (noteData: CreateNoteRequest) => {};
const validateSummonerName = (name: string): boolean => {};

// 変数: camelCase, 名詞
const summonerProfile: SummonerProfile = {};
const matchHistory: MatchData[] = [];
const isLoadingNotes: boolean = false;

// 定数: SCREAMING_SNAKE_CASE
const MAX_SUMMONER_NAME_LENGTH = 16;
const DEFAULT_REGION = 'na';
const API_ENDPOINTS = {
  SUMMONER: '/api/summoner',
  NOTES: '/api/notes'
} as const;
```

#### コンポーネント
```typescript
// React コンポーネント: PascalCase
const SummonerProfile: React.FC<SummonerProfileProps> = () => {};
const MatchHistoryTable: React.FC<MatchHistoryProps> = () => {};
const ChampionNoteEditor: React.FC<NoteEditorProps> = () => {};

// Props インターフェース: ComponentName + Props
interface SummonerProfileProps {
  summoner: SummonerProfile;
  loading?: boolean;
}

interface MatchHistoryProps {
  matches: MatchData[];
  onMatchSelect?: (match: MatchData) => void;
}
```

### Python

#### クラス・モデル
```python
# ドメインモデル: PascalCase
class SummonerProfile(BaseModel):
    id: str
    name: str
    level: int
    rank: Optional[RankInfo] = None

class ChampionNote(BaseModel):
    id: int
    user_id: str
    my_champion_id: str
    enemy_champion_id: str
    runes: Dict[str, Any]
    spells: List[str]
    items: List[str]
    memo: str
    created_at: datetime
    updated_at: Optional[datetime] = None

# サービスクラス: PascalCase + Service suffix
class SummonerService:
    async def get_summoner_profile(self, region: str, name: str) -> SummonerProfile:
        pass

class NoteService:
    async def create_note(self, user_id: str, note_data: CreateNoteRequest) -> ChampionNote:
        pass
```

#### 関数・変数
```python
# 関数: snake_case
async def fetch_summoner_profile(region: str, summoner_name: str) -> SummonerProfile:
    pass

async def create_champion_note(user_id: str, note_data: dict) -> ChampionNote:
    pass

def validate_summoner_name(name: str) -> bool:
    pass

# 変数: snake_case
summoner_profile: SummonerProfile
match_history: List[MatchData]
is_loading_notes: bool

# 定数: SCREAMING_SNAKE_CASE
MAX_SUMMONER_NAME_LENGTH = 16
DEFAULT_REGION = "na"
API_BASE_URL = "https://api.riotgames.com"
```

### データベース

#### テーブル名・カラム名
```sql
-- テーブル名: snake_case (複数形)
CREATE TABLE app_users (
    id UUID PRIMARY KEY,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    image TEXT,
    provider TEXT NOT NULL,
    provider_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE champion_notes (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES app_users(id),
    my_champion_id TEXT NOT NULL,
    enemy_champion_id TEXT NOT NULL,
    runes JSONB,
    spells JSONB,
    items JSONB,
    memo TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- インデックス名: idx_ + テーブル名 + カラム名
CREATE INDEX idx_champion_notes_user_id ON champion_notes(user_id);
CREATE INDEX idx_champion_notes_champions ON champion_notes(my_champion_id, enemy_champion_id);
```

### API エンドポイント

#### REST API パス
```bash
# リソース名: kebab-case (複数形)
GET    /api/summoners/{region}/{name}
GET    /api/summoners/{region}/{name}/matches
GET    /api/champion-notes
POST   /api/champion-notes
PUT    /api/champion-notes/{id}
DELETE /api/champion-notes/{id}

# ネストしたリソース
GET    /api/users/{user_id}/champion-notes
POST   /api/users/{user_id}/champion-notes
```

#### クエリパラメータ
```bash
# snake_case
GET /api/champion-notes?my_champion=yasuo&enemy_champion=zed&page=1&page_size=20
GET /api/summoners/na/player1/matches?game_mode=ranked&start_time=1234567890
```

## 略語・頭字語一覧

### League of Legends関連
| 略語 | 正式名称 | 日本語 |
|------|----------|--------|
| LoL | League of Legends | リーグ・オブ・レジェンド |
| KDA | Kills/Deaths/Assists | キル/デス/アシスト |
| CS | Creep Score | ミニオン撃破数 |
| LP | League Points | リーグポイント |
| MMR | Matchmaking Rating | マッチメイキングレーティング |
| ADC | Attack Damage Carry | アタックダメージキャリー |
| AP | Ability Power | アビリティパワー |
| CC | Crowd Control | クラウドコントロール |
| CD | Cooldown | クールダウン |
| HP | Health Points | ヘルスポイント |
| MP | Mana Points | マナポイント |

### 技術関連
| 略語 | 正式名称 | 日本語 |
|------|----------|--------|
| API | Application Programming Interface | アプリケーションプログラミングインターフェース |
| UI | User Interface | ユーザーインターフェース |
| UX | User Experience | ユーザーエクスペリエンス |
| HTTP | HyperText Transfer Protocol | ハイパーテキスト転送プロトコル |
| JSON | JavaScript Object Notation | JavaScript オブジェクト記法 |
| JWT | JSON Web Token | JSON ウェブトークン |
| OAuth | Open Authorization | オープン認証 |
| CRUD | Create, Read, Update, Delete | 作成、読み取り、更新、削除 |
| ORM | Object-Relational Mapping | オブジェクト関係マッピング |
| SQL | Structured Query Language | 構造化クエリ言語 |

### プロジェクト固有
| 略語 | 正式名称 | 日本語 |
|------|----------|--------|
| PBT | Property-Based Testing | プロパティベーステスト |
| TDD | Test-Driven Development | テスト駆動開発 |
| CI/CD | Continuous Integration/Continuous Deployment | 継続的インテグレーション/継続的デプロイメント |
| SPA | Single Page Application | シングルページアプリケーション |
| SSR | Server-Side Rendering | サーバーサイドレンダリング |
| CSR | Client-Side Rendering | クライアントサイドレンダリング |
| PWA | Progressive Web App | プログレッシブウェブアプリ |

## 文脈による使い分け

### 「ユーザー」の使い分け
```typescript
// アプリケーション利用者
interface User {
  id: string;
  email: string;
  name: string;
}

// League of Legendsプレイヤー (サモナー)
interface Summoner {
  id: string;
  name: string;
  level: number;
}

// 文脈での使い分け
const appUser = getCurrentUser();        // アプリ利用者
const summonerData = getSummoner(name);  // LoLプレイヤー
```

### 「プロフィール」の使い分け
```typescript
// ユーザープロフィール (アプリ内)
interface UserProfile {
  id: string;
  email: string;
  preferences: UserPreferences;
}

// サモナープロフィール (LoL内)
interface SummonerProfile {
  id: string;
  name: string;
  level: number;
  rank: RankInfo;
}
```

### 「ノート」vs「メモ」
```typescript
// ノート: 構造化されたデータ全体
interface ChampionNote {
  id: number;
  matchup: Matchup;
  runes: RuneConfiguration;
  spells: SummonerSpell[];
  items: Item[];
  memo: string;  // ← この部分が「メモ」
}

// メモ: ノート内のテキスト部分
const strategyMemo: string = "レベル3でオールインを狙う";
```

## 用語の一貫性ルール

### 1. 同一概念は同一用語
```typescript
// ✅ Good: 一貫した用語使用
interface SummonerProfile { name: string; }
const getSummonerName = (summoner: SummonerProfile) => summoner.name;
const validateSummonerName = (name: string) => { /* */ };

// ❌ Bad: 同一概念で異なる用語
interface SummonerProfile { name: string; }
const getPlayerName = (summoner: SummonerProfile) => summoner.name;  // Player vs Summoner
const validateUserName = (name: string) => { /* */ };               // User vs Summoner
```

### 2. 略語の統一
```typescript
// ✅ Good: 略語の一貫使用
interface KDAStats {
  kills: number;
  deaths: number;
  assists: number;
}

const calculateKDA = (stats: KDAStats) => { /* */ };
const formatKDAString = (kda: number) => { /* */ };

// ❌ Bad: 略語と正式名称の混在
interface KillDeathAssistStats { /* */ }  // 正式名称
const calculateKDA = () => { /* */ };      // 略語
```

### 3. 言語間の対応
```typescript
// TypeScript (英語)
interface ChampionNote {
  myChampionId: string;
  enemyChampionId: string;
  memo: string;
}

// Python (英語)
class ChampionNote(BaseModel):
    my_champion_id: str
    enemy_champion_id: str
    memo: str

// UI表示 (日本語)
const labels = {
  myChampion: '自分のチャンピオン',
  enemyChampion: '相手のチャンピオン',
  memo: '戦略メモ'
};
```

### 4. 複数形の統一
```typescript
// ✅ Good: 複数形の一貫使用
interface MatchData {
  participants: ParticipantData[];  // 複数形
}

const getMatches = () => { /* */ };        // 複数形
const matchHistory: MatchData[] = [];      // 複数形

// ❌ Bad: 単数形と複数形の混在
interface MatchData {
  participant: ParticipantData[];  // 単数形だが配列
}
```