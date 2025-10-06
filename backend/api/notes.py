from fastapi import APIRouter
from fastapi.responses import JSONResponse
from models.note_model import ChampionNote
from services.supabase_service import create_champion_note

router = APIRouter()


@router.post("/champion_notes")
async def create_note(note: ChampionNote):
    result, status = await create_champion_note(note.dict())
    return JSONResponse(result, status_code=status)
