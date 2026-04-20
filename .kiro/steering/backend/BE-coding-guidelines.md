---
inclusion: fileMatch
fileMatchPattern: 'backend/**/*'
---

# バックエンドコーディング規約

## ファイル構成

**1ファイル250行以内**を厳守。超える場合は機能ごとにサブディレクトリを切って分割する。

## レイヤー構造

```
api/ → services/ → adapters/ → 外部サービス
```

- **api/**: HTTPリクエスト/レスポンス
- **services/**: ビジネスロジック、DB操作
- **adapters/**: 外部サービス腐敗防止層
- **schemas/**: Pydantic入出力型定義
- **utils/**: 汎用ユーティリティ

## 命名規則

- **関数・変数**: snake_case
- **クラス**: PascalCase
- **定数**: UPPER_SNAKE_CASE
- **プライベート**: `_leading_underscore`

## 型定義

全関数に型ヒント必須。

## エラーハンドリング

`HTTPException`を使用。404/400/500を適切に使い分ける。

## ロギング

`logging`モジュールを使用。機密情報はログに含めない。
