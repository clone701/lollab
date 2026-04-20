---
inclusion: fileMatch
fileMatchPattern: 'frontend/**/*'
---

# フロントエンドコーディング規約

## 命名規則
- 変数・関数: camelCase / コンポーネント: PascalCase / 定数: UPPER_SNAKE_CASE
- boolean: `is`, `has`, `should` プレフィックス
- イベントハンドラ: `handle` プレフィックス

## 型定義
- 関数の引数と戻り値に型を明示。`any` 禁止（代替: `unknown`）

## ファイルサイズ規約
- 1ファイル1関数・1コンポーネント
- import除き**60行以内**
- 超える場合はサブディレクトリに分割し `index.ts` に集約（例外なし）

## ファイル種別ルール
- `.tsx`: JSX・Reactフック・コンポーネント・カスタムフックのみ
- `.ts`: 純粋関数・ビジネスロジック・型定義・zodスキーマ・APIマッピング
- `.ts` に JSX・React import 禁止 / `.tsx` にビジネスロジック直書き禁止

## Public API パターン
- サブディレクトリには必ず `index.ts` を置き、外部からは `index.ts` 経由のみ参照
- `index.ts` 内部の import は相対パス（`./`）を使用

## コンポーネント
- デフォルトはServer Components。hooks/ブラウザAPI使用時のみ `'use client'`

## セマンティックHTML
- `<div onClick>` 禁止 → `<button>` を使用
- ナビ: `<nav>` / ヘッダー: `<header>` / メイン: `<main>` / フッター: `<footer>`

## 依存方向ルール

```
app/ → components/ → adapters/
                   → lib/
```

- `app/` は `components/` に依存してよい（逆は禁止）
- `components/` は `adapters/` と `lib/` に依存してよい（逆は禁止）
- `components/` 内では「使う側 → 使われる側」の一方向のみ（汎用コンポーネントが固有コンポーネントを参照しない）

## 認証（Supabase Auth）
- `useAuth()` で認証状態取得（`@/lib/contexts/AuthContext`）
- 外部サービス操作は `@/adapters/` 経由のみ

## 画像
- 静的画像: `next/image` / GIF: `<img>` タグ
- パス: `/images/champion/`, `/images/item/`, `/images/runes/`, `/images/loading/`

## スタイル
- Tailwind CSSをインラインで使用
- 選択状態: `ring-2 ring-amber-400 shadow-md shadow-amber-400/30 bg-amber-50/50`

## パス解決
- `@/*` → `./src/*`（tsconfig.jsonで設定済み）

## 禁止事項
- `eval()` / 無検証 `dangerouslySetInnerHTML` / 機密情報ハードコード
