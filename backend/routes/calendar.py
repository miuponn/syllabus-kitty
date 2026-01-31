from fastapi import APIRouter
from typing import Dict


router = APIRouter(prefix="/api/calendar", tags=["calendar"])


@router.post("/create")
async def create_calendar_from_syllabus() -> Dict[str, str]:
    """
    Create a Google Calendar from extracted syllabus data
    (To be implemented)
    """
    return {
        "status": "not_implemented",
        "message": "Google Calendar integration coming soon!"
    }


@router.get("/health")
async def health_check() -> Dict[str, str]:
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "calendar-integration"
    }
