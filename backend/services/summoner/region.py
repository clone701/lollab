"""地域マッピングサービス: リージョン文字列をRiot APIホスト識別子に変換する。"""

from fastapi import HTTPException

PLATFORM_MAP: dict[str, str] = {
    "JP": "jp1",
    "KR": "kr",
    "NA": "na1",
    "EUW": "euw1",
    "EUNE": "eun1",
    "OCE": "oc1",
}

REGIONAL_MAP: dict[str, str] = {
    "JP": "asia",
    "KR": "asia",
    "NA": "americas",
    "EUW": "europe",
    "EUNE": "europe",
    "OCE": "sea",
}


def get_platform(region: str) -> str:
    """リージョン文字列をPlatformホスト識別子に変換する。

    Args:
        region: リージョン文字列（例: "JP", "KR"）

    Returns:
        Platformホスト識別子（例: "jp1", "kr"）

    Raises:
        HTTPException: 無効なリージョン値の場合はHTTP 400
    """
    platform = PLATFORM_MAP.get(region.upper() if isinstance(region, str) else region)
    if platform is None:
        raise HTTPException(
            status_code=400,
            detail=f"無効なリージョンです: {region}。有効な値: {', '.join(PLATFORM_MAP.keys())}",
        )
    return platform


def get_regional(region: str) -> str:
    """リージョン文字列をRegionalホスト識別子に変換する。

    Args:
        region: リージョン文字列（例: "JP", "NA"）

    Returns:
        Regionalホスト識別子（例: "asia", "americas"）

    Raises:
        HTTPException: 無効なリージョン値の場合はHTTP 400
    """
    regional = REGIONAL_MAP.get(region.upper() if isinstance(region, str) else region)
    if regional is None:
        raise HTTPException(
            status_code=400,
            detail=f"無効なリージョンです: {region}。有効な値: {', '.join(REGIONAL_MAP.keys())}",
        )
    return regional
