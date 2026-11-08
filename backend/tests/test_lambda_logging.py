"""lambda_handlers のログの設定のテスト。"""

import importlib
import logging

import lambda_handlers


def test_app_info_logs_are_enabled_and_httpx_is_quiet() -> None:
    """アプリの INFO は出し、URL（PUUID を含む）を出す httpx・httpcore は WARNING 以上だけにする。"""
    importlib.reload(lambda_handlers)

    assert logging.getLogger().level == logging.INFO
    assert logging.getLogger("services.crawler.run").getEffectiveLevel() == logging.INFO
    for name in ("httpx", "httpcore"):
        assert logging.getLogger(name).getEffectiveLevel() == logging.WARNING
