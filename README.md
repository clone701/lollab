# LoL Lab — 努力を勝率に変える研究所
LoLプレイヤー向けの学習・統計サイト。サモナー検索からランクと直近試合のKDA/CS/ダメージ等を可視化します。
将来的にチャンピオン別の自己成績集計や練習目標のトラッキングを提供予定。

## 技術スタック
- Frontend: Next.js (Vercel)
- Backend: Python (Vercel Serverless Functions)
- DB/Cache: 検討中（Neon/Supabase/Upstash）

## 使用API（予定）
- Riot: summoner-v4 / league-v4 / match-v5
- Data Dragon（チャンピオン等の静的データ）

## 運用方針
- レート制限遵守、短期キャッシュ実装、不要な大量取得はしません。
- PUUIDを主キーに最小限の統計のみ保存。削除リクエストに対応。

## 非公式表記
This is an unofficial fan site and is not endorsed by Riot Games.  
We do not use Riot's trademarks or logos.

## 環境変数（例）
- `RIOT_API_KEY` : Riot Developer Portalで取得
