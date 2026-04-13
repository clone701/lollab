# 自動実行ツール設定ガイド

## 導入した自動実行ツール

### 1. Git Hooks (Husky)

#### pre-commit (コミット前)
**フロントエンド**:
- ESLint自動修正
- Prettier自動フォーマット
- 変更ファイルに関連するテスト実行

**バックエンド**:
- Black フォーマットチェック
- isort インポート順序チェック
- Flake8 Lintチェック
- mypy 型チェック

#### pre-push (プッシュ前)
- TypeScript型チェック
- ESLint全体チェック
- Jest全テスト実行
- **npm audit (high以上の脆弱性チェック)**

### 2. VSCode自動保存設定

`.vscode/settings.json`で以下を自動化:
- 保存時にPrettier自動フォーマット
- 保存時にESLint自動修正
- Python保存時にBlack自動フォーマット
- Python保存時にインポート自動整理

### 3. GitHub Actions CI

PRとpush時に自動実行:

**フロントエンド**:
- **セキュリティ監査 (npm audit)**
- 型チェック
- Lint
- フォーマットチェック
- テスト
- ビルド

**バックエンド**:
- フォーマットチェック (Black)
- インポート順序チェック (isort)
- Lint (Flake8)
- 型チェック (mypy)
- セキュリティチェック (Bandit)
- **依存関係監査 (Safety)**

**定期実行**:
- 毎週月曜日 9:00 (JST) に脆弱性チェック

### 4. Dependabot (自動依存関係更新)

**設定内容**:
- **マイナー・パッチアップデートのみ自動PR作成**
- **メジャーアップデートは手動レビュー必須**
- 毎週月曜日 9:00 (JST) にチェック
- フロントエンド (npm)、バックエンド (pip)、GitHub Actions を監視

**動作**:
1. 脆弱性のあるパッケージを検出
2. マイナー・パッチ更新の場合 → 自動でPR作成
3. メジャー更新の場合 → 無視（手動で対応）
4. PR作成後、CIが自動実行
5. CIパス後、手動でマージ

### 5. ESLint強化ルール

追加された検出項目:
- React Hooks依存配列の不足
- 未使用変数
- console.log (本番前に削除推奨)

## 脆弱性チェックの階層

### レベル1: 開発時 (VSCode)
- リアルタイムでコード品質チェック
- 保存時に自動修正

### レベル2: コミット時 (pre-commit)
- ステージングファイルのチェック・修正
- 軽量で高速

### レベル3: プッシュ時 (pre-push)
- 全体の型チェック、Lint、テスト
- **high以上の脆弱性チェック**

### レベル4: PR時 (GitHub Actions)
- チーム全体で統一された基準
- **moderate以上の脆弱性チェック**
- ビルド確認

### レベル5: 定期実行 (GitHub Actions scheduled)
- 毎週月曜日に脆弱性チェック
- 新しい脆弱性の早期発見

### レベル6: 自動更新 (Dependabot)
- マイナー・パッチ更新を自動PR
- メジャー更新は手動レビュー

## セットアップ手順

### 初回セットアップ

```bash
# フロントエンド
cd frontend
npm install

# Huskyフックを有効化
npm run prepare

# バックエンド
cd ../backend
pip install -r requirements.txt
```

### Windowsでのフック実行権限設定

```bash
# Git Bashまたはコマンドプロンプトで実行
git update-index --chmod=+x .husky/pre-commit
git update-index --chmod=+x .husky/pre-push
git update-index --chmod=+x .husky/pre-commit-backend
```

### VSCode拡張機能のインストール

推奨拡張機能:
- **ESLint** (dbaeumer.vscode-eslint)
- **Prettier** (esbenp.prettier-vscode)
- **Python** (ms-python.python)
- **Black Formatter** (ms-python.black-formatter)

## 使い方

### 開発フロー

1. **コード編集**: VSCodeで保存時に自動フォーマット
2. **コミット**: pre-commitフックで自動チェック・修正
3. **プッシュ**: pre-pushフックで全体チェック + 脆弱性チェック
4. **PR作成**: GitHub Actionsで自動CI実行 + 脆弱性チェック
5. **定期監視**: 毎週月曜日に自動脆弱性チェック
6. **自動更新**: Dependabotがマイナー・パッチ更新のPRを自動作成

### 手動実行コマンド

#### フロントエンド
```bash
cd frontend

# 全チェック実行
npm run validate

# 個別実行
npm run type-check    # 型チェック
npm run lint          # Lint
npm run lint:fix      # Lint自動修正
npm run format        # フォーマット
npm run format-check  # フォーマットチェック
npm run test:ci       # テスト
npm run test:coverage # カバレッジ付きテスト
npm audit             # 脆弱性チェック (全レベル)
npm audit --audit-level=moderate  # moderate以上
npm audit --audit-level=high      # high以上
npm audit fix         # マイナー・パッチ自動修正
```

#### バックエンド
```bash
cd backend

# フォーマット
black .
isort .

# チェック
black --check .
isort --check-only .
flake8 .
mypy .
bandit -r . -ll
safety check
pip-audit
```

## 脆弱性対応フロー

### 1. 脆弱性検出
- pre-push、CI、または定期実行で検出
- Dependabotが自動でPR作成（マイナー・パッチの場合）

### 2. 自動修正（マイナー・パッチ）
```bash
cd frontend
npm audit fix  # メジャー更新は含まれない
```

### 3. 手動修正（メジャー更新）
```bash
# package.jsonで範囲指定を変更
"next": "~15.5.15"  # パッチのみ
"next": "^15.5.15"  # マイナー・パッチ
"next": "15.5.15"   # 固定

npm install
npm test
```

### 4. Dependabot PRのマージ
1. Dependabotが自動でPR作成
2. CIが自動実行
3. CIパス確認
4. 手動でマージ

## バージョン管理戦略

### package.jsonのバージョン指定

```json
{
  "dependencies": {
    "next": "~15.5.15",  // パッチのみ (15.5.x)
    "react": "19.1.0"     // 固定
  },
  "devDependencies": {
    "eslint": "^9.36.0"  // マイナー・パッチ (9.x.x)
  }
}
```

**記号の意味**:
- `~15.5.15`: パッチのみ更新 (15.5.x)
- `^15.5.15`: マイナー・パッチ更新 (15.x.x)
- `15.5.15`: 固定バージョン

**推奨**:
- **本番依存**: `~` (パッチのみ) - 安定性重視
- **開発依存**: `^` (マイナー・パッチ) - 新機能も取り込む
- **重要パッケージ**: 固定 - 完全な制御

## トラブルシューティング

### Huskyフックが実行されない

```bash
# フックを再インストール
cd frontend
npm run prepare
```

### pre-commitが失敗する

```bash
# 自動修正を試す
cd frontend
npm run lint:fix
npm run format

cd ../backend
black .
isort .
```

### 脆弱性が修正できない

```bash
# 詳細を確認
npm audit

# 特定のパッケージを更新
npm update <package-name>

# メジャー更新が必要な場合
npm install <package-name>@latest
```

### Dependabot PRが多すぎる

`.github/dependabot.yml`で調整:
```yaml
open-pull-requests-limit: 3  # 同時PR数を減らす
schedule:
  interval: "monthly"  # 頻度を下げる
```

### GitHub Actionsが失敗する

ローカルで同じチェックを実行:
```bash
# フロントエンド
cd frontend
npm run validate
npm audit --audit-level=moderate
npm run build

# バックエンド
cd backend
black --check .
isort --check-only .
flake8 .
mypy .
bandit -r . -ll
safety check
```

## カスタマイズ

### 脆弱性チェックレベルの変更

#### pre-push (厳しくする)
```bash
# .husky/pre-push
npm audit --audit-level=moderate  # high → moderate
```

#### CI (緩くする)
```yaml
# .github/workflows/ci.yml
npm audit --audit-level=high  # moderate → high
```

### Dependabotの設定変更

```yaml
# .github/dependabot.yml
schedule:
  interval: "daily"  # 毎日チェック
open-pull-requests-limit: 10  # PR数を増やす

# 特定パッケージのメジャー更新を許可
ignore:
  - dependency-name: "eslint"
    update-types: []  # 全て許可
```

### ESLintルールの調整

`frontend/eslint.config.mjs`を編集:
```javascript
rules: {
  "react-hooks/exhaustive-deps": "error", // warn → error
  "no-console": "off", // console.logを許可
}
```

### Huskyフックの無効化

一時的に無効化:
```bash
git commit --no-verify
git push --no-verify
```

## 効果

### 検出できるバグ・脆弱性
- 状態管理の不整合（依存配列の不足）
- 型エラー
- 未使用変数
- フォーマット不統一
- **セキュリティ脆弱性（moderate以上）**
- **依存関係の古いバージョン**

### 開発効率向上
- 保存時の自動フォーマット
- コミット前の自動修正
- CI/CDでの早期エラー検出
- **脆弱性の自動検出・修正**
- **依存関係の自動更新（マイナー・パッチ）**
- コードレビューの負担軽減

### セキュリティ向上
- 定期的な脆弱性スキャン
- 自動依存関係更新
- メジャー更新は手動レビュー必須
- 複数階層での脆弱性チェック
