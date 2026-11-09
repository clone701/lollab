---
inclusion: fileMatch
fileMatchPattern: 'frontend/**/*.{tsx,ts,jsx,js,css}'
---

# デザインシステム

## フォント
**Noto Sans JP**

## カラー（ダークテーマのみ）

色は `frontend/src/app/globals.css` の `@theme` で定義した**役割の名前**だけを使う。`bg-white`、`bg-gray-*`、`text-gray-*`、`border-gray-*` などの直接の色指定は禁止。

| 役割 | クラス例 | 値 |
|---|---|---|
| ページ背景 | `bg-canvas` | `#0b1220` |
| カード・パネル | `bg-surface` | `#121a2b` |
| 入力欄・ホバー・入れ子の面 | `bg-surface-2` | `#1a2438` |
| 枠線（標準 / 強調） | `border-line` / `border-line-strong` | `#26324a` / `#34425f` |
| 文字（本文 / 補足 / 控えめ） | `text-fg` / `text-fg-muted` / `text-fg-subtle` | `#e5e7eb` / `#9ca3af` / `#8591a3` |
| アクセント（リンク・選択・フォーカス） | `text-accent` / `ring-accent` / `bg-accent` | `#60a5fa` |
| アクションボタン | `bg-action` / `hover:bg-action-hover` | `#2563eb` / `#1d4ed8` |
| 削除ボタン / エラー文字 | `bg-danger` / `hover:bg-danger-hover` / `text-danger-fg` | `#dc2626` / `#b91c1c` / `#f87171` |
| 勝利・高い勝率 / 敗北・低い勝率 | `text-win` / `text-loss`（背景は `bg-win/15`・`bg-loss/15`） | `#34d399` / `#f87171` |
| 強調（お気に入り・注目） | `text-highlight` / `ring-highlight` | `#fbbf24` |
| ゲームの説明文（物理 / 魔法 / 回復 / シールド / 状態異常 / マナ / 用語 / 数値） | `text-game-physical` / `text-game-magic` / `text-game-heal` / `text-game-shield` / `text-game-status` / `text-game-mana` / `text-game-keyword` / `text-game-number`（ツールチップ・基礎情報のゲームの文と数値だけに使う） | `#fb923c` / `#818cf8` / `#4ade80` / `#7dd3fc` / `#c084fc` / `#93c5fd` / `#48c4b7` / `#fde68a` |
| ブルーチーム / レッドチーム（試合の文字・比較バー） | `text-team-blue` / `text-team-red`（棒は `bg-team-blue`・`bg-team-red`） | `#6b9cf0` / `#f06a7e` |

- コントラストは WCAG AA（本文 4.5:1）を満たす組み合わせだけを使う。白文字は `bg-action`・`bg-danger` とそのホバー色の上でのみ使う（ホバーは暗くする）

## 状態
- ホバー（カード・アイコン）: `hover:ring-2 hover:ring-accent/60`
- 選択中: `ring-2 ring-accent bg-accent/15`
- 無効: `opacity-50 cursor-not-allowed`
- オーバーレイ: `bg-black/60`

## タイポグラフィ
- サイズ: `text-xs`(12px) / `text-sm`(14px) / `text-base`(16px) / `text-xl`(20px)
- ウェイト: `font-medium`(500) / `font-semibold`(600) / `font-bold`(700)

## スペーシング
- パディング: `p-2`(8px) / `p-3`(12px) / `p-4`(16px)
- ギャップ: `gap-2`(8px) / `gap-3`(12px) / `gap-4`(16px)

## その他
- ボーダー: `rounded`(4px) / `rounded-lg`(8px) / `rounded-full`
- シャドウ: `shadow-sm` / `shadow-md`（暗い背景では弱く見えるため、面の区別は背景色と枠線で行う）
- トランジション: `transition-colors duration-150`
- フォーカス（キーボード操作時のみ）: `focus:outline-none focus-visible:ring-2 focus-visible:ring-accent`
