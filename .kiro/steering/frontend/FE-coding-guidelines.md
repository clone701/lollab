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
- adapter も1ファイル1関数にし、テーブル単位のディレクトリ（例: `adapters/supabase/pickSheets/`）にまとめる
- `index.ts` 内部の import は相対パス（`./`）を使用

## コンポーネント
- デフォルトはServer Components。hooks/ブラウザAPI使用時のみ `'use client'`

## 画面の状態と URL
- 共有・再訪問・他画面からのリンクで開く状態（タブ・選択中のチャンピオン・検索中のサモナーなど）は URL のクエリで持つ
- 静的書き出し（`output: 'export'`）のため、クエリは `useSearchParams` を `Suspense` で囲んで読む。不正な値は無視して既定値にする
- URL の組み立て・読み取りは `lib/` の純粋関数にする（例: `lib/notes` の `buildNotesHref`・`parseNotesParams`）
- 更新は、画面の移動として戻れるべきもの（別のサモナーの検索）は `router.push`、同じ画面内の切り替え（タブ・選択）は `router.replace`

## 未保存の変更
- 編集画面で未保存の変更があるとき、キャンセル・タブの切り替えは `window.confirm` で確認し、リロード・タブを閉じるのは `beforeunload` で確認する

## チャンピオンの並び順
- 画面に並べるチャンピオンの一覧は、日本語の読みの五十音順にする（`champions.ts` は英語の ID 順のため、そのまま並べない）

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
- 色は design-system.md の役割の名前（`bg-surface`、`text-fg` など）だけを使う

## パス解決
- `@/*` → `./src/*`（tsconfig.jsonで設定済み）

## SOLID原則

- **S（単一責任）**: 1コンポーネント・1関数は1つの責務のみ。表示とデータ取得を混ぜない
- **O（開放閉鎖）**: props/型で拡張可能に設計し、既存コードの修正なく機能追加できるようにする
- **L（リスコフの置換）**: 共通interfaceを実装するコンポーネントは、親が期待する振る舞いを満たす
- **I（インターフェース分離）**: propsは必要最小限。巨大なpropsオブジェクトを渡さず、必要なデータだけ受け取る
- **D（依存性逆転）**: コンポーネントは具体的な外部サービスに直接依存しない。adapters/lib経由で抽象化する
