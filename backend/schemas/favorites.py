from pydantic import BaseModel, Field


class FavoriteCreate(BaseModel):
    summoner_name: str = Field(..., min_length=1, max_length=16)
    tag_line: str = Field(..., min_length=1, max_length=5)
    region: str = Field(..., min_length=2, max_length=4)


class FavoriteResponse(BaseModel):
    id: str
    summoner_name: str
    tag_line: str
    region: str
    created_at: str
