# LoL Lab — 努力を勝率に変える研究所

LoL プレイヤーの**学習・準備・振り返り**を支援する非公式 Web アプリです。サモナー検索でランク・直近試合の KDA/CS/ダメージなどを可視化し、**チャンピオン別の対策メモ**（ビルド/ルーン/マッチアップ注意点）を自分用に保存して、対戦前後に素早く確認できます。

> **Legal**: This is an **unofficial fan site** and is **not endorsed by Riot Games**. We do not use Riot’s trademarks or logos.

---

## 目次

* [機能](#機能)
* [技術スタック](#技術スタック)
* [ディレクトリ構成](#ディレクトリ構成)
* [アーキテクチャ概要](#アーキテクチャ概要)
* [セットアップ (ローカル)](#セットアップ-ローカル)
* [環境変数](#環境変数)
* [開発スクリプト](#開発スクリプト)
* [デプロイ (Vercel)](#デプロイ-vercel)
* [Riot API 利用ポリシー/方針](#riot-api-利用ポリシー方針)
* [データ取り扱い](#データ取り扱い)
* [ロードマップ](#ロードマップ)
* [ライセンス](#ライセンス)
* [貢献](#貢献)

---

## 機能

* 🔎 **サモナー検索**：ランク情報、直近試合の基本スタッツ (K/D/A, CS, DMG)
* 🗒️ **チャンピオン別メモ**：対策・ビルド・ルーン・マッチアップ所感を保存
* 📈 **自己成績の簡易集計**（計画）：対面別・チャンピオン別の勝率/KDA 推移
* 🟢 **ライブ簡易パネル**（計画）：観戦/試合中のクイックビュー

## 技術スタック

* **Frontend**: Next.js (App Router, TypeScript, Tailwind CSS)
* **Backend**: Python (Vercel Serverless Functions under `/api`)
* **DB/Cache**: 予定（Neon / Supabase / Upstash Redis）
* **Infra**: Vercel (GitHub 連携, Preview/Prod 自動デプロイ)

## ディレクトリ構成
lollab/
├─ api/
└─ src/
   ├─ app/
   │  ├─ layout.tsx         ← 既存を更新（Navbar/Footer を読み込み）
   │  └─ page.tsx           ← HOME 画面（ヒーロー/検索/サイドカード/ピン）
   ├─ components/
   │  ├─ Navbar.tsx
   │  ├─ Footer.tsx
   │  ├─ SearchBar.tsx
   │  ├─ RecentChips.tsx
   │  └─ PinnedChips.tsx
   └─ lib/
      ├─ storage.ts         ← localStorage ユーティリティ
      └─ runeData.ts 

## アーキテクチャ概要

```
Browser (Next.js) ── same origin ─▶ /api/* (Python on Vercel)
                                   └─▶ Riot API (summoner-v4 / league-v4 / match-v5)
                                   └─▶ Data Dragon (static data)
[Optional] Redis / Postgres for caching & aggregates
```

* **CORS回避**：フロントと API を同一ドメイン（Vercel プロジェクト内）に配置
* **Rate Limit配慮**：短期キャッシュ＋バックオフで Riot API 呼び出しを節約

## セットアップ (ローカル)

### 前提

* Node.js **LTS (>=18)** / npm
* Git / VS Code（推奨）
* (Windows) **WSL2 + Ubuntu** を推奨

### 初回手順

```bash
# クローン
git clone git@github.com:<your-account>/lollab.git
cd lollab

# 依存をインストール
npm install

# 環境変数ファイルを作成
cp .env.local.example .env.local  # ない場合は手動で作成
# .env.local に RIOT_API_KEY=... を記入

# 起動
npx next dev  # http://localhost:3000
```

## 環境変数

> **注意**: Riot のキーは**クライアントに公開しない**ため、`NEXT_PUBLIC_` 接頭辞は付けません。

| Name           | Scope  | Description                        |
| -------------- | ------ | ---------------------------------- |
| `RIOT_API_KEY` | Server | Riot Developer Portal で発行した API キー |

例: `.env.local`

```
RIOT_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## 開発スクリプト

* `npm run dev` – 開発サーバ
* `npm run build` – 本番ビルド
* `npm run start` – 本番サーバ（Vercel では自動）
* `npm run lint` – ESLint

## デプロイ (Vercel)

1. Vercel にログイン → **Add New → Project** → GitHub から `lollab` を Import
2. Framework: **Next.js**（自動検出） / Root Directory: `/`
3. **Project → Settings → Environment Variables** に `RIOT_API_KEY` を **Production/Preview/Development** すべて追加
4. **Deploy / Redeploy**。完了後に URL から初期ページ表示を確認

> **Tips**: 環境変数の変更は**再デプロイ**しないと反映されません。

git add .
git commit -m "Add champion select modal with recent champions"
git push origin main

## Riot API 利用ポリシー/方針

* 使用 API：`summoner-v4`, `league-v4`, `match-v5`。静的データは **Data Dragon**。
* ルーティング：**JP1 (platform)** / **ASIA (regional)** を想定。
* **Rate Limit 厳守**：429 時は指数バックオフ＋リトライ、短期キャッシュ（分単位）。
* **最小呼び出し**：ユーザー操作に応じた必要最小限のフェッチのみ。

## データ取り扱い

* **PUUID** を主キーとして最小限の統計のみ保存（予定）。
* 個人特定情報・第三者提供・販売は行わない。削除リクエストに対応。
* 監査向けログは最小限・安全に保存。

## ロードマップ

* [ ] `/api` Python 関数で Riot API プロキシ（サモナー/ランク/直近試合）
* [ ] 直近試合 UI（勝敗/KDA/CS/DMG/チャンピオン）
* [ ] メモ機能（チャンピオン別テンプレ/タグ/検索）
* [ ] キャッシュ導入（Upstash Redis）
* [ ] 二次集計（対面別勝率/KPI）
* [ ] ライブ簡易パネル

## ライセンス

* OSS として公開する場合は **MIT** を推奨。未定なら記載を保留。

## 貢献

Issues / PR 歓迎。スタイルは ESLint/Prettier に準拠。リリース前の API キーや個人情報は含めないでください。