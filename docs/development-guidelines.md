# 開発ガイドライン

## コーディング規約

### TypeScript/JavaScript 規約

#### 基本原則
- **型安全性**: TypeScriptの型システムを最大限活用
- **可読性**: 明確で理解しやすいコードを書く
- **一貫性**: プロジェクト全体で統一されたスタイル
- **保守性**: 変更・拡張しやすい構造

#### 変数・関数命名
```typescript
// ✅ Good: 明確で説明的な名前
const summonerProfile = await fetchSummonerData(region, name);
const isLoadingMatchHistory = true;
const calculateWinRate = (wins: number, losses: number): number => {
  return wins / (wins + losses) * 100;
};

// ❌ Bad: 曖昧で短すぎる名前
const data = await fetch(r, n);
const loading = true;
const calc = (w: number, l: number): number => w / (w + l) * 100;
```

#### 型定義
```typescript
// ✅ Good: 明確なインターフェース定義
interface SummonerProfile {
  readonly id: string;
  readonly name: string;
  readonly level: number;
  readonly rank?: RankInfo;
}

interface CreateNoteRequest {
  myChampionId: string;
  enemyChampionId: string;
  runes: RuneConfiguration;
  spells: readonly string[];
  items: readonly string[];
  memo: string;
}

// ✅ Good: Union型の活用
type LoadingState = 'idle' | 'loading' | 'success' | 'error';
type Region = 'na' | 'euw' | 'kr' | 'jp';

// ❌ Bad: any型の使用
const data: any = await fetchData();
```

#### 関数定義
```typescript
// ✅ Good: 純粋関数、明確な戻り値型
const formatWinRate = (wins: number, losses: number): string => {
  const rate = (wins / (wins + losses)) * 100;
  return `${rate.toFixed(1)}%`;
};

// ✅ Good: 非同期関数の適切な型定義
const fetchSummonerProfile = async (
  region: Region,
  name: string
): Promise<SummonerProfile> => {
  const response = await apiClient.get(`/summoner/${region}/${name}`);
  return response.data;
};

// ❌ Bad: 副作用のある関数、型定義なし
let globalState = {};
const updateData = (data) => {
  globalState = { ...globalState, ...data };
  return globalState;
};
```

#### エラーハンドリング
```typescript
// ✅ Good: 明確なエラー型定義
class SummonerNotFoundError extends Error {
  constructor(region: string, name: string) {
    super(`Summoner ${name} not found in ${region}`);
    this.name = 'SummonerNotFoundError';
  }
}

// ✅ Good: Result型パターン
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

const fetchSummoner = async (
  region: Region,
  name: string
): Promise<Result<SummonerProfile, SummonerNotFoundError>> => {
  try {
    const data = await apiClient.get(`/summoner/${region}/${name}`);
    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      error: new SummonerNotFoundError(region, name) 
    };
  }
};
```

### Python 規約

#### 基本原則
- **PEP 8**: Python公式スタイルガイドに準拠
- **型ヒント**: Python 3.9+ の型ヒントを活用
- **ドキュメント**: docstringによる適切な文書化
- **テスタビリティ**: テストしやすい構造

#### 命名規則
```python
# ✅ Good: PEP 8準拠の命名
class SummonerService:
    def __init__(self, riot_client: RiotAPIClient) -> None:
        self._riot_client = riot_client
    
    async def get_summoner_profile(
        self, 
        region: str, 
        summoner_name: str
    ) -> SummonerProfile:
        """サモナープロフィールを取得する"""
        pass

# 定数
MAX_MATCH_HISTORY_COUNT = 10
DEFAULT_CACHE_TTL = 300

# 変数
summoner_profile: SummonerProfile
is_loading_matches: bool
match_history_list: List[MatchData]
```

#### 型ヒント
```python
from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel

# ✅ Good: 明確な型ヒント
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

async def create_note(
    user_id: str, 
    note_data: CreateNoteRequest
) -> ChampionNote:
    """新しいノートを作成する"""
    pass

# ✅ Good: Union型の使用
ResponseType = Union[SummonerProfile, ErrorResponse]
```

#### エラーハンドリング
```python
# ✅ Good: カスタム例外クラス
class SummonerNotFoundError(Exception):
    """サモナーが見つからない場合の例外"""
    def __init__(self, region: str, summoner_name: str):
        self.region = region
        self.summoner_name = summoner_name
        super().__init__(f"Summoner {summoner_name} not found in {region}")

class RiotAPIError(Exception):
    """Riot API関連のエラー"""
    def __init__(self, status_code: int, message: str):
        self.status_code = status_code
        self.message = message
        super().__init__(f"Riot API Error {status_code}: {message}")

# ✅ Good: 適切な例外処理
async def get_summoner_profile(
    region: str, 
    summoner_name: str
) -> SummonerProfile:
    try:
        response = await riot_client.get_summoner(region, summoner_name)
        return SummonerProfile(**response)
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            raise SummonerNotFoundError(region, summoner_name)
        raise RiotAPIError(e.response.status_code, str(e))
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise
```

## 命名規則

### ファイル・ディレクトリ命名

#### フロントエンド
```bash
# コンポーネントファイル: PascalCase
SummonerProfile.tsx
MatchHistoryTable.tsx
ChampionNoteEditor.tsx

# ページファイル: kebab-case (Next.js App Router)
app/summoner/[region]/[name]/page.tsx
app/notes/create/page.tsx

# ユーティリティファイル: camelCase
apiClient.ts
validationUtils.ts
formatHelpers.ts

# ディレクトリ: kebab-case
components/summoner-profile/
lib/api-client/
hooks/use-summoner/
```

#### バックエンド
```bash
# Pythonファイル: snake_case
summoner_service.py
note_repository.py
riot_api_client.py

# ディレクトリ: snake_case
services/summoner_service/
models/champion_note/
utils/validation_helpers/
```

### 変数・関数命名パターン

#### Boolean値
```typescript
// ✅ Good: is/has/can/should プレフィックス
const isLoading = true;
const hasError = false;
const canEdit = user.id === note.userId;
const shouldShowModal = isAuthenticated && hasPermission;

// ❌ Bad: 曖昧な名前
const loading = true;
const error = false;
const edit = true;
```

#### 関数命名
```typescript
// ✅ Good: 動詞 + 名詞パターン
const fetchSummonerData = async () => {};
const validateUserInput = (input: string) => {};
const formatMatchHistory = (matches: MatchData[]) => {};
const calculateWinRate = (wins: number, losses: number) => {};

// イベントハンドラー: handle + イベント名
const handleSubmit = (event: FormEvent) => {};
const handleChampionSelect = (championId: string) => {};
const handleNoteDelete = (noteId: number) => {};

// ✅ Good: 述語関数 (boolean返却)
const isValidSummonerName = (name: string): boolean => {};
const hasRequiredPermissions = (user: User): boolean => {};
const canCreateNote = (user: User): boolean => {};
```

#### 定数命名
```typescript
// ✅ Good: SCREAMING_SNAKE_CASE
const MAX_SUMMONER_NAME_LENGTH = 16;
const DEFAULT_REGION = 'na';
const API_ENDPOINTS = {
  SUMMONER: '/api/summoner',
  MATCHES: '/api/matches',
  NOTES: '/api/notes'
} as const;

// ✅ Good: 列挙型
enum LoadingState {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error'
}
```

## スタイリング規約

### Tailwind CSS 規約

#### クラス順序
```tsx
// ✅ Good: 論理的な順序
<div className="
  // Layout
  flex flex-col items-center justify-center
  // Spacing
  p-4 m-2 gap-4
  // Sizing
  w-full max-w-md h-auto
  // Typography
  text-lg font-semibold text-gray-900
  // Background & Border
  bg-white border border-gray-200 rounded-lg
  // Effects
  shadow-md hover:shadow-lg
  // Transitions
  transition-shadow duration-200
">
```

#### レスポンシブデザイン
```tsx
// ✅ Good: モバイルファースト
<div className="
  // Mobile (default)
  flex-col space-y-4 p-4
  // Tablet
  md:flex-row md:space-y-0 md:space-x-6 md:p-6
  // Desktop
  lg:p-8 lg:max-w-4xl
  // Large Desktop
  xl:max-w-6xl
">
```

#### カスタムコンポーネントスタイル
```tsx
// ✅ Good: 再利用可能なスタイル定義
const buttonVariants = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900',
  danger: 'bg-red-600 hover:bg-red-700 text-white'
};

const Button: React.FC<ButtonProps> = ({ variant = 'primary', ...props }) => (
  <button 
    className={`
      px-4 py-2 rounded-md font-medium transition-colors duration-200
      ${buttonVariants[variant]}
    `}
    {...props}
  />
);
```

### CSS-in-JS (styled-components)
```tsx
// 必要な場合のみ使用（Tailwindで表現困難な場合）
const AnimatedCard = styled.div<{ isVisible: boolean }>`
  transform: translateY(${props => props.isVisible ? '0' : '20px'});
  opacity: ${props => props.isVisible ? 1 : 0};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
`;
```

## テスト規約

### テスト構造

#### ファイル構成
```bash
# テストファイル配置
src/
├── components/
│   ├── SummonerProfile.tsx
│   └── __tests__/
│       └── SummonerProfile.test.tsx
├── lib/
│   ├── utils/
│   │   ├── validation.ts
│   │   └── __tests__/
│   │       └── validation.test.ts
└── __tests__/
    ├── pages/
    └── integration/
```

#### テスト命名
```typescript
// ✅ Good: 説明的なテスト名
describe('SummonerProfile', () => {
  describe('when summoner data is provided', () => {
    it('should display summoner name and level', () => {});
    it('should show rank information when available', () => {});
    it('should handle missing rank data gracefully', () => {});
  });

  describe('when loading', () => {
    it('should display loading spinner', () => {});
    it('should disable interactive elements', () => {});
  });

  describe('when error occurs', () => {
    it('should display error message', () => {});
    it('should provide retry option', () => {});
  });
});
```

#### テストパターン
```typescript
// ✅ Good: AAA パターン (Arrange, Act, Assert)
it('should calculate win rate correctly', () => {
  // Arrange
  const wins = 7;
  const losses = 3;
  const expected = '70.0%';

  // Act
  const result = formatWinRate(wins, losses);

  // Assert
  expect(result).toBe(expected);
});

// ✅ Good: モックの適切な使用
it('should fetch summoner data on mount', async () => {
  // Arrange
  const mockSummoner = { id: '1', name: 'TestPlayer', level: 30 };
  const mockFetch = jest.fn().mockResolvedValue(mockSummoner);
  
  // Act
  render(<SummonerProfile fetchSummoner={mockFetch} />);
  
  // Assert
  await waitFor(() => {
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(screen.getByText('TestPlayer')).toBeInTheDocument();
  });
});
```

### プロパティベーステスト
```typescript
import fc from 'fast-check';

// ✅ Good: プロパティベーステスト
describe('validation utilities', () => {
  it('should validate summoner names correctly for all valid inputs', () => {
    fc.assert(fc.property(
      fc.string({ minLength: 3, maxLength: 16 })
        .filter(s => /^[a-zA-Z0-9_]+$/.test(s)),
      (validName) => {
        expect(isValidSummonerName(validName)).toBe(true);
      }
    ));
  });

  it('should reject invalid summoner names', () => {
    fc.assert(fc.property(
      fc.oneof(
        fc.string({ maxLength: 2 }), // Too short
        fc.string({ minLength: 17 }), // Too long
        fc.string().filter(s => /[^a-zA-Z0-9_]/.test(s)) // Invalid chars
      ),
      (invalidName) => {
        expect(isValidSummonerName(invalidName)).toBe(false);
      }
    ));
  });
});
```

## Git規約

### ブランチ命名
```bash
# 機能開発
feature/user-authentication
feature/summoner-search
feature/champion-notes

# バグ修正
fix/summoner-search-timeout
fix/note-validation-error

# ホットフィックス
hotfix/critical-security-patch
hotfix/api-rate-limit-fix

# リリース準備
release/v1.0.0
release/v1.1.0

# 実験的機能
experiment/new-ui-design
experiment/performance-optimization
```

### コミットメッセージ
```bash
# 形式: <type>(<scope>): <description>
# 
# <body>
# 
# <footer>

# 例:
feat(auth): add Google OAuth integration

- Implement NextAuth.js configuration
- Add Google OAuth provider setup
- Create user session management
- Add login/logout UI components

Closes #123

fix(api): resolve summoner search timeout

The Riot API client was not properly handling timeout errors,
causing the application to hang when the API was slow to respond.

- Add 5-second timeout to all API requests
- Implement proper error handling for timeout scenarios
- Add retry logic with exponential backoff

Fixes #456

docs(readme): update installation instructions

- Add Node.js version requirement
- Include environment variable setup steps
- Add troubleshooting section

chore(deps): update dependencies to latest versions

- Update Next.js to 14.0.4
- Update React to 18.2.0
- Update TypeScript to 5.3.2
- Update all dev dependencies

test(notes): add comprehensive test coverage

- Add unit tests for note creation
- Add integration tests for note API
- Add property-based tests for validation
- Achieve 95% test coverage

refactor(services): extract common API logic

- Create base API client class
- Extract error handling to middleware
- Implement request/response interceptors
- Reduce code duplication by 40%
```

### プルリクエスト規約

#### PRテンプレート
```markdown
## 概要
<!-- 変更内容の簡潔な説明 -->

## 変更内容
<!-- 具体的な変更点をリストアップ -->
- [ ] 新機能の追加
- [ ] バグ修正
- [ ] リファクタリング
- [ ] ドキュメント更新
- [ ] テスト追加

## テスト
<!-- テスト内容と結果 -->
- [ ] ユニットテスト追加・更新
- [ ] 統合テスト実行
- [ ] 手動テスト実行
- [ ] プロパティベーステスト追加

## スクリーンショット
<!-- UI変更がある場合のスクリーンショット -->

## チェックリスト
- [ ] コードレビュー完了
- [ ] テストが全て通過
- [ ] ドキュメント更新
- [ ] 破壊的変更の確認
- [ ] パフォーマンス影響の確認

## 関連Issue
<!-- 関連するIssue番号 -->
Closes #123
Related to #456
```

#### レビュー基準
```markdown
## コードレビューチェックポイント

### 機能性
- [ ] 要件を満たしているか
- [ ] エッジケースが考慮されているか
- [ ] エラーハンドリングが適切か

### コード品質
- [ ] 命名規則に従っているか
- [ ] 可読性が高いか
- [ ] 重複コードがないか
- [ ] 適切な抽象化レベルか

### パフォーマンス
- [ ] 不要な再レンダリングがないか
- [ ] メモリリークの可能性がないか
- [ ] API呼び出しが最適化されているか

### セキュリティ
- [ ] 入力検証が適切か
- [ ] 認証・認可が正しく実装されているか
- [ ] 機密情報の漏洩がないか

### テスト
- [ ] 適切なテストカバレッジがあるか
- [ ] テストが意味のあるケースをカバーしているか
- [ ] プロパティベーステストが必要な箇所で使用されているか
```

## コードレビュー規約

### レビュー観点

#### 1. 機能性レビュー
```typescript
// ✅ Good: エッジケースを考慮
const formatWinRate = (wins: number, losses: number): string => {
  if (wins < 0 || losses < 0) {
    throw new Error('Wins and losses must be non-negative');
  }
  
  const total = wins + losses;
  if (total === 0) {
    return '0.0%';
  }
  
  const rate = (wins / total) * 100;
  return `${rate.toFixed(1)}%`;
};

// ❌ Bad: エッジケースを考慮していない
const formatWinRate = (wins: number, losses: number): string => {
  return `${((wins / (wins + losses)) * 100).toFixed(1)}%`;
};
```

#### 2. パフォーマンスレビュー
```typescript
// ✅ Good: メモ化による最適化
const ExpensiveComponent = React.memo(({ data }: { data: ComplexData }) => {
  const processedData = useMemo(() => {
    return expensiveCalculation(data);
  }, [data]);

  return <div>{processedData}</div>;
});

// ✅ Good: 適切なキー使用
{items.map(item => (
  <ItemComponent key={item.id} item={item} />
))}

// ❌ Bad: 不適切なキー使用
{items.map((item, index) => (
  <ItemComponent key={index} item={item} />
))}
```

#### 3. セキュリティレビュー
```typescript
// ✅ Good: 入力検証
const createNote = async (noteData: CreateNoteRequest): Promise<ChampionNote> => {
  // バリデーション
  const validatedData = CreateNoteSchema.parse(noteData);
  
  // サニタイゼーション
  const sanitizedMemo = DOMPurify.sanitize(validatedData.memo);
  
  return await noteService.create({
    ...validatedData,
    memo: sanitizedMemo
  });
};

// ❌ Bad: 検証なしの直接使用
const createNote = async (noteData: any) => {
  return await noteService.create(noteData);
};
```

### レビューコメント例

#### 建設的なフィードバック
```markdown
# ✅ Good: 具体的で建設的
**提案**: この関数は複数の責任を持っているようです。データ取得とフォーマットを分離することで、テストしやすくなり、再利用性も向上します。

```typescript
// 提案する改善案
const fetchSummonerData = async (region: string, name: string) => { ... };
const formatSummonerProfile = (data: RawSummonerData) => { ... };
```

# ✅ Good: 質問形式
**質問**: この処理でエラーが発生した場合、ユーザーにはどのようなフィードバックが表示されますか？エラーハンドリングの追加を検討してはいかがでしょうか？

# ✅ Good: 学習機会の提供
**情報共有**: React 18のuseDeferredValueを使用すると、この検索処理のパフォーマンスが向上する可能性があります。
参考: https://react.dev/reference/react/useDeferredValue

# ❌ Bad: 批判的で非建設的
このコードは汚い。書き直して。
```

### レビュー承認基準

#### 必須条件
- [ ] 全てのテストが通過
- [ ] コーディング規約に準拠
- [ ] セキュリティ要件を満たす
- [ ] パフォーマンス要件を満たす
- [ ] 適切なドキュメント・コメント

#### 推奨条件
- [ ] コードカバレッジ80%以上
- [ ] プロパティベーステスト追加（該当する場合）
- [ ] アクセシビリティ要件を満たす
- [ ] 国際化対応（該当する場合）

## 品質管理

### 自動化ツール設定

#### ESLint設定
```json
// .eslintrc.json
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended",
    "@typescript-eslint/recommended-requiring-type-checking",
    "prettier"
  ],
  "parserOptions": {
    "project": "./tsconfig.json"
  },
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/prefer-nullish-coalescing": "error",
    "@typescript-eslint/prefer-optional-chain": "error",
    "prefer-const": "error",
    "no-var": "error",
    "no-console": "warn"
  }
}
```

#### Prettier設定
```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "avoid"
}
```

#### Husky + lint-staged
```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "git add"
    ],
    "*.{json,md}": [
      "prettier --write",
      "git add"
    ]
  },
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "pre-push": "npm run test && npm run build"
    }
  }
}
```

### 継続的品質改善

#### メトリクス監視
```typescript
// 品質メトリクス
interface QualityMetrics {
  testCoverage: number;        // テストカバレッジ
  codeComplexity: number;      // 循環的複雑度
  duplicateCode: number;       // 重複コード率
  technicalDebt: number;       // 技術的負債時間
  bugDensity: number;          // バグ密度
  performanceScore: number;    // パフォーマンススコア
}

// 品質ゲート
const QUALITY_GATES = {
  testCoverage: 80,           // 80%以上
  codeComplexity: 10,         // 10以下
  duplicateCode: 5,           // 5%以下
  performanceScore: 90        // 90点以上
};
```

#### 定期レビュー
```markdown
## 週次品質レビュー
- [ ] テストカバレッジ確認
- [ ] パフォーマンスメトリクス確認
- [ ] セキュリティスキャン実行
- [ ] 依存関係脆弱性チェック

## 月次アーキテクチャレビュー
- [ ] コード品質メトリクス分析
- [ ] 技術的負債の評価
- [ ] リファクタリング計画策定
- [ ] 新技術導入検討

## 四半期技術レビュー
- [ ] アーキテクチャ全体の見直し
- [ ] パフォーマンス最適化計画
- [ ] セキュリティ監査実施
- [ ] 開発プロセス改善
```