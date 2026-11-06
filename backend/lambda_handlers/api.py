"""lollab-api の Lambda ハンドラー: FastAPI アプリを Mangum で包む。

SSM からの設定の読み込みは config の import 時（コールドスタート時）に行われる。
"""

from mangum import Mangum

from main import app

handler = Mangum(app, lifespan="auto")
