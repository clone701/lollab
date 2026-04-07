# Reference Files

このディレクトリには、Specで実装を作成する際の参照用ファイルが含まれています。

## 目的

- 手動で作成した実装を保存
- Spec作成時の参考資料として使用
- データ構造、API設計、認証フローの参照

## 注意事項

⚠️ **このディレクトリのファイルは実行されません**

- 参照用のみ
- 実際の実装は `frontend/` と `backend/` で行う
- Specで実装する際に、これらのファイルを参考にする

## ディレクトリ構造

```
reference/
├── frontend/
│   ├── champions.ts          # チャンピオンデータ定義
│   ├── items.ts              # アイテムデータ定義
│   ├── runeData.ts           # ルーンデータ定義
│   ├── summonerSpells.ts     # スペルデータ定義
│   ├── supabase.ts           # Supabase設定
│   ├── auth-route.ts         # NextAuth設定
│   └── providers.tsx         # SessionProvider設定
└── backend/
    ├── main.py               # FastAPIエントリーポイント
    ├── notes.py              # ノートAPI
    ├── users.py              # ユーザーAPI
    ├── note_model.py         # ノートモデル
    └── config.py             # 設定管理
```

## 使用方法

### Spec作成時

1. 関連する参照ファイルを確認
2. データ構造、API設計を理解
3. Specの要件・設計に反映
4. Kiroに実装させる

### 例: チャンピオンデータを使う機能

```markdown
# Spec: チャンピオン選択機能

## 参照ファイル
- `reference/frontend/champions.ts` - チャンピオンデータ構造

## データ構造
- Champion型: { key, id, name, icon }
- CHAMPIONS配列: 全171チャンピオン
```

## 更新履歴

- 2026-04-07: 初回作成（手動実装からの移行）
