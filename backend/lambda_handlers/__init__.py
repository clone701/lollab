"""Lambda のハンドラー。

Lambda の Python ランタイムはルートロガーのレベルを WARNING にしているため、
アプリの INFO ログ（クローラーの起動ごとの結果など）が出ない。
ハンドラーを読み込んだ時点で INFO にする（ローカル開発・テストでは読み込まれない）。
"""

import logging

logging.getLogger().setLevel(logging.INFO)
