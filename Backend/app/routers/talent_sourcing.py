from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.himalayas_mcp import fetch_candidates_from_himalayas

router = APIRouter(prefix="/talent")

class SearchRequest(BaseModel):
    recruiter_query: str

@router.post("/sourcing/himalayas/search")
async def search_talent(request: SearchRequest):
    try:
        results = await fetch_candidates_from_himalayas(request.recruiter_query)
        
        print("candidates ", results)
        return {"status": "success", "candidates": results}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))