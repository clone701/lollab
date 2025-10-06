# サーバー起動
uvicorn main:app --reload

# ディレクトリ構成
backend/
├── main.py                # アプリのエントリーポイント
├── config.py              # 環境変数の一括管理
├── api/                   # ルーティングやエンドポイント
│   ├── __init__.py
│   └── notes.py           # /api/notes関連のエンドポイント
├── core/                  # 設定や共通処理
│   ├── __init__.py
│   └── config.py          # 設定（環境変数など）
├── services/              # 外部サービス連携（Supabaseなど）
│   ├── __init__.py
│   └── supabase.py
├── models/                # Pydanticモデル
│   ├── __init__.py
│   └── note.py
├── requirements.txt