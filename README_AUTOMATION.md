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

### 2. VSCode自動保存設定

`.vscode/settings.json`で以下を自動化:
- 保存時にPrettier自動フォーマット
- 保存時にESLint自動修正
- Python保存時にBlack自動フォーマット
- Python保存時にインポート自動整理

### 3. GitHub Actions CI

PRとpush時に自動実行:

**フロントエンド**:
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
- 依存関係監査 (Safety)

### 4. ESLint強化ルール

追加された検出項目:
- React Hooks依存配列の不足
- 未使用変数
- console.log (本番前に削除推奨)

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

Windowsでは`chmod`が使えないため、Git Bashで実行:

```bash
# Git Bashを開いて実行
git update-index --chmod=+x .husky/pre-commit
git update-index --chmod=+x .husky/pre-push
git update-index --chmod=+x .husky/pre-commit-backend
```

または、WSL/Git Bashで:
```bash
chmod +x .husky/pre-commit .husky/pre-push .husky/pre-commit-backend
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
3. **プッシュ**: pre-pushフックで全体チェック
4. **PR作成**: GitHub Actionsで自動CI実行

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
```

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

### GitHub Actionsが失敗する

ローカルで同じチェックを実行:
```bash
# フロントエンド
cd frontend
npm run validate
npm run build

# バックエンド
cd backend
black --check .
isort --check-only .
flake8 .
mypy .
```

## カスタマイズ

### ESLintルールの調整

`frontend/eslint.config.mjs`を編集:
```javascript
rules: {
  "react-hooks/exhaustive-deps": "warn", // "error"に変更可能
  "no-console": "off", // console.logを許可
}
```

### Huskyフックの無効化

一時的に無効化:
```bash
git commit --no-verify
git push --no-verify
```

### lint-stagedの対象変更

`frontend/package.json`の`lint-staged`セクションを編集。

## 効果

### 検出できるバグ
- 状態管理の不整合（依存配列の不足）
- 型エラー
- 未使用変数
- フォーマット不統一
- セキュリティ脆弱性

### 開発効率向上
- 保存時の自動フォーマット
- コミット前の自動修正
- CI/CDでの早期エラー検出
- コードレビューの負担軽減
