"""お気に入りCRUD APIルーター"""

from fastapi import APIRouter, Header, HTTPException

from adapters.supabase import supabase
from schemas.favorites import FavoriteCreate, FavoriteResponse

router = APIRouter(prefix="/api/favorites")

MAX_FAVORITES = 10


def _get_user_id(authorization: str | None) -> str:
    """Authorizationヘッダーからユーザー情報を取得する。"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="認証が必要です")
    token = authorization.removeprefix("Bearer ")
    # Supabaseでトークンを検証してユーザーIDを取得
    user = supabase.auth.get_user(token)
    if not user or not user.user:
        raise HTTPException(status_code=401, detail="無効なトークンです")
    return user.user.id


@router.get("")
async def list_favorites(
    authorization: str | None = Header(default=None),
) -> list[FavoriteResponse]:
    """ログインユーザーのお気に入り一覧を取得する。"""
    user_id = _get_user_id(authorization)
    result = (
        supabase.table("favorites")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return [
        FavoriteResponse(
            id=row["id"],
            summoner_name=row["summoner_name"],
            tag_line=row["tag_line"],
            region=row["region"],
            created_at=row["created_at"],
        )
        for row in result.data
    ]


@router.post("", status_code=201)
async def add_favorite(
    body: FavoriteCreate,
    authorization: str | None = Header(default=None),
) -> FavoriteResponse:
    """お気に入りに追加する（上限10人）。"""
    user_id = _get_user_id(authorization)

    # 上限チェック
    count_result = (
        supabase.table("favorites")
        .select("id", count="exact")  # type: ignore[arg-type]
        .eq("user_id", user_id)
        .execute()
    )
    if count_result.count is not None and count_result.count >= MAX_FAVORITES:
        raise HTTPException(
            status_code=400,
            detail=f"お気に入りは最大{MAX_FAVORITES}人までです",
        )

    # 重複チェック
    dup = (
        supabase.table("favorites")
        .select("id")
        .eq("user_id", user_id)
        .eq("summoner_name", body.summoner_name)
        .eq("tag_line", body.tag_line)
        .eq("region", body.region)
        .execute()
    )
    if dup.data:
        raise HTTPException(status_code=409, detail="既にお気に入りに登録されています")

    result = (
        supabase.table("favorites")
        .insert(
            {
                "user_id": user_id,
                "summoner_name": body.summoner_name,
                "tag_line": body.tag_line,
                "region": body.region,
            }
        )
        .execute()
    )
    row = result.data[0]
    return FavoriteResponse(
        id=row["id"],
        summoner_name=row["summoner_name"],
        tag_line=row["tag_line"],
        region=row["region"],
        created_at=row["created_at"],
    )


@router.delete("/{favorite_id}", status_code=204)
async def remove_favorite(
    favorite_id: str,
    authorization: str | None = Header(default=None),
) -> None:
    """お気に入りを削除する。"""
    user_id = _get_user_id(authorization)
    result = (
        supabase.table("favorites")
        .delete()
        .eq("id", favorite_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="お気に入りが見つかりません")
