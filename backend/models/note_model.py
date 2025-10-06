from pydantic import BaseModel
from typing import Any, List, Dict


class ChampionNote(BaseModel):
    user_id: str
    my_champion_id: str
    enemy_champion_id: str
    runes: Dict[str, Any]         # JSONオブジェクト
    spells: List[str]             # 配列
    items: List[str]              # 配列
    memo: str
