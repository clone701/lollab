"""Lambda のハンドラー。

Lambda の Python ランタイムはルートロガーのレベルを WARNING にしているため、
アプリの INFO ログ（クローラーの起動ごとの結果など）が出ない。
ハンドラーを読み込んだ時点で INFO にする（ローカル開発・テストでは読み込まれない）。

通信ライブラリ（httpx・httpcore）の INFO ログは、リクエストの URL（PUUID などを含む）を
1件ずつ出すため WARNING に上げる（ログに PUUID を出さない。ログの量も抑える）。
"""

import logging

logging.getLogger().setLevel(logging.INFO)

# リクエストの URL をログに出すライブラリ
_NOISY_LOGGERS = ("httpx", "httpcore")

for _name in _NOISY_LOGGERS:
    logging.getLogger(_name).setLevel(logging.WARNING)
