from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from typing import Dict, Any
import aiofiles
import os
from pathlib import Path
import uuid
from datetime import datetime

from services.gemini_service import gemini_service
from config import settings


router = APIRouter(prefix="/api/syllabus", tags=["syllabus"])


@router.post("/upload")
async def upload_syllabus(
    file: UploadFile = File(...)
) -> JSONResponse:
    """
    Upload a syllabus PDF and extract structured information using Gemini AI
    
    Args:
        file: PDF file to process
        
    Returns:
        Extracted syllabus information as JSON
    """
    # Validate file type
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported"
        )
    
    # Validate file size
    file_size = 0
    content = await file.read()
    file_size = len(content)
    
    if file_size > settings.max_upload_size_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"File size exceeds maximum allowed size of {settings.max_upload_size_mb}MB"
        )
    
    # Reset file pointer
    await file.seek(0)
    
    # Create uploads directory if it doesn't exist
    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate unique filename
    file_id = str(uuid.uuid4())
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_filename = f"{timestamp}_{file_id}_{file.filename}"
    file_path = upload_dir / safe_filename
    
    try:
        # Save file to disk
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(content)
        
        # Upload to Gemini File API
        gemini_file = await gemini_service.upload_file(
            str(file_path),
            display_name=file.filename
        )
        
        # Extract information using Gemini
        extracted_data = await gemini_service.extract_syllabus_info(gemini_file)
        
        # Add metadata
        result = {
            "file_id": file_id,
            "filename": file.filename,
            "uploaded_at": timestamp,
            "extracted_data": extracted_data
        }
        
        return JSONResponse(
            status_code=200,
            content=result
        )
        
    except Exception as e:
        # Clean up file if processing failed
        if file_path.exists():
            os.remove(file_path)
        
        raise HTTPException(
            status_code=500,
            detail=f"Error processing syllabus: {str(e)}"
        )


@router.get("/health")
async def health_check() -> Dict[str, str]:
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "syllabus-extraction",
        "model": settings.gemini_model_id
    }
