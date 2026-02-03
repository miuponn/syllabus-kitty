""" Endpoints for simplifying syllabi"""

from fastapi import APIRouter, HTTPException, Header
from fastapi.responses import Response
from pydantic import BaseModel
from typing import Optional, Dict, Any
from services.simplified_syllabus_service import (
    create_and_translate_simplified_syllabus,
    create_simplified_pdf,
    get_supported_languages,
    SUPPORTED_LANGUAGES
)
from services.supabase_service import supabase_service

router = APIRouter(prefix="/api/simplify", tags=["simplify"])


def verify_user(authorization: str = None) -> Optional[Dict[str, Any]]:
    """Verify user from JWT token."""
    if not authorization:
        return None
    token = authorization.replace("Bearer ", "")
    return supabase_service.verify_jwt(token)


class SimplifyRequest(BaseModel):
    """Request body for simplify endpoint."""
    syllabus_data: Dict[str, Any]
    target_language: str = "en"
    original_filename: Optional[str] = None


class SimplifyFromIdRequest(BaseModel):
    """Request body for simplifying from syllabus ID."""
    target_language: str = "en"


class SimplifyResponse(BaseModel):
    """Response from simplify endpoint."""
    english: str
    translated: Optional[str] = None
    language: str
    language_name: str


class LanguagesResponse(BaseModel):
    """Response listing supported languages."""
    languages: Dict[str, str]


class PdfRequest(BaseModel):
    """Request body for PDF generation."""
    syllabus_data: Dict[str, Any]
    target_language: str = "en"
    original_filename: Optional[str] = None
    syllabus_id: Optional[str] = None  # Optional: if provided, store simplified markdown in DB


class TranslateRequest(BaseModel):
    """Request body for translation endpoint."""
    syllabus_id: str
    target_language: str
    generate_pdf: bool = True  # Whether to return a PDF or just the translated markdown


@router.get("/languages", response_model=LanguagesResponse)
async def list_supported_languages():
    return LanguagesResponse(languages=get_supported_languages())


@router.post("/", response_model=SimplifyResponse)
async def simplify_syllabus(
    request: SimplifyRequest,
    authorization: str = Header(None)
):
    """
    Generate a simplified, accessible version of a syllabus.
    
    Optionally translates to another language if target_language is not 'en'.
    
    The simplified version:
    - Uses plain language (good for ESL students)
    - Has predictable structure (good for screen readers)
    - Includes action items and checklists (good for ADHD/executive function)
    - Clearly marks missing information
    """
    try:
        # Verify user (optional - allowing unauthenticated access)
        user = verify_user(authorization)
        
        # Validate target language
        if request.target_language not in SUPPORTED_LANGUAGES:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported language: {request.target_language}. Use GET /api/simplify/languages for supported options."
            )
        
        # Generate simplified syllabus
        result = create_and_translate_simplified_syllabus(
            syllabus_data=request.syllabus_data,
            target_language=request.target_language,
            original_filename=request.original_filename
        )
        
        return SimplifyResponse(
            english=result["english"],
            translated=result.get("translated"),
            language=result["language"],
            language_name=result["language_name"]
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Error simplifying syllabus: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to simplify syllabus: {str(e)}")


# IMPORTANT: Static paths like /pdf, /languages, /translate MUST come BEFORE dynamic paths like /{syllabus_id}
# Otherwise FastAPI will match them as syllabus_id

@router.post("/pdf", response_class=Response)
async def generate_simplified_pdf(
    request: PdfRequest,
    authorization: str = Header(None)
):
    """
    Generate a simplified syllabus and return it as a PDF.
    
    Returns a downloadable PDF file with accessible formatting.
    If syllabus_id is provided, stores the simplified English markdown in the database.
    """
    try:
        # Verify user (optional)
        user = verify_user(authorization)
        
        # Validate target language
        if request.target_language not in SUPPORTED_LANGUAGES:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported language: {request.target_language}"
            )
        
        # Generate simplified PDF
        result = create_simplified_pdf(
            syllabus_data=request.syllabus_data,
            target_language=request.target_language,
            original_filename=request.original_filename
        )
        
        # Store simplified markdown in database if syllabus_id is provided
        if request.syllabus_id:
            try:
                supabase = supabase_service.supabase
                supabase.table("sillabi").update({
                    "simplified_markdown": result["english_markdown"]
                }).eq("file_id", request.syllabus_id).execute()
                print(f"✅ Stored simplified markdown for syllabus {request.syllabus_id}")
            except Exception as db_error:
                print(f"⚠️ Failed to store simplified markdown: {db_error}")
                # Don't fail the request if DB storage fails
        
        # Create filename
        course_name = request.syllabus_data.get("courseInfo", {}).get("courseName", "syllabus")
        safe_course_name = "".join(c for c in course_name if c.isalnum() or c in (' ', '-', '_')).strip()
        lang_suffix = f"_{request.target_language}" if request.target_language != "en" else ""
        filename = f"simplified_{safe_course_name}{lang_suffix}.pdf"
        
        return Response(
            content=result["pdf_bytes"],
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error generating PDF: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {str(e)}")


@router.post("/translate", response_class=Response)
async def translate_simplified_syllabus_endpoint(
    request: TranslateRequest,
    authorization: str = Header(None)
):
    """
    Translate a previously simplified syllabus to another language.
    
    Fetches the simplified markdown from the database, translates it,
    and returns a PDF (or markdown if generate_pdf is false).
    """
    from services.simplified_syllabus_service import translate_simplified_syllabus, markdown_to_pdf
    
    try:
        # Verify user (optional)
        user = verify_user(authorization)
        
        # Validate target language
        if request.target_language not in SUPPORTED_LANGUAGES:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported language: {request.target_language}. Use GET /api/simplify/languages for supported options."
            )
        
        # Fetch simplified markdown from database
        supabase = supabase_service.supabase
        result = supabase.table("sillabi").select("simplified_markdown, course_name").eq("file_id", request.syllabus_id).single().execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Syllabus not found")
        
        simplified_markdown = result.data.get("simplified_markdown")
        course_name = result.data.get("course_name", "syllabus")
        
        if not simplified_markdown:
            raise HTTPException(
                status_code=400, 
                detail="No simplified version found. Please click 'Simplify' first to generate a simplified syllabus."
            )
        
        # If English is requested, just return the stored markdown
        if request.target_language == "en":
            translated_markdown = simplified_markdown
        else:
            # Translate to target language
            translated_markdown = translate_simplified_syllabus(simplified_markdown, request.target_language)
        
        # Generate PDF if requested
        if request.generate_pdf:
            language_name = SUPPORTED_LANGUAGES.get(request.target_language, request.target_language)
            title = f"Simplified Syllabus - {course_name} ({language_name})"
            pdf_bytes = markdown_to_pdf(translated_markdown, title)
            
            # Create filename
            safe_course_name = "".join(c for c in course_name if c.isalnum() or c in (' ', '-', '_')).strip()
            lang_suffix = f"_{request.target_language}" if request.target_language != "en" else ""
            filename = f"simplified_{safe_course_name}{lang_suffix}.pdf"
            
            return Response(
                content=pdf_bytes,
                media_type="application/pdf",
                headers={
                    "Content-Disposition": f'attachment; filename="{filename}"'
                }
            )
        else:
            # Return markdown as JSON
            from fastapi.responses import JSONResponse
            return JSONResponse(content={
                "markdown": translated_markdown,
                "language": request.target_language,
                "language_name": SUPPORTED_LANGUAGES.get(request.target_language, request.target_language)
            })
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error translating syllabus: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to translate syllabus: {str(e)}")


@router.post("/{syllabus_id}", response_model=SimplifyResponse)
async def simplify_syllabus_by_id(
    syllabus_id: str,
    request: SimplifyFromIdRequest,
    authorization: str = Header(None)
):
    """
    Generate a simplified version of a syllabus by its ID.
    
    Fetches the syllabus data from Supabase and generates the simplified version.
    """
    try:
        # Verify user (optional)
        user = verify_user(authorization)
        
        # Validate target language
        if request.target_language not in SUPPORTED_LANGUAGES:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported language: {request.target_language}"
            )
        
        # Get Supabase client
        supabase = supabase_service.supabase
        
        # Fetch syllabus data from Supabase
        syllabus_result = supabase.table("sillabi").select("*").eq("file_id", syllabus_id).single().execute()
        
        if not syllabus_result.data:
            raise HTTPException(status_code=404, detail="Syllabus not found")
        
        syllabus_meta = syllabus_result.data
        
        # Then get all calendar items for this syllabus
        items_result = supabase.table("calendar_items").select("event_json, type").eq("syllabus_id", syllabus_id).execute()
        
        # Combine into a structure for the simplifier
        syllabus_data = {
            "course_name": syllabus_meta.get("course_name"),
            "pdf_url": syllabus_meta.get("pdf_url"),
            "extracted_data": syllabus_meta.get("extracted_data"),
            "calendar_events": [item["event_json"] for item in (items_result.data or [])],
            "event_types": {item["event_json"].get("summary", ""): item["type"] for item in (items_result.data or [])}
        }
        
        # Generate simplified syllabus
        result = create_and_translate_simplified_syllabus(
            syllabus_data=syllabus_data,
            target_language=request.target_language,
            original_filename=syllabus_meta.get("course_name")
        )
        
        return SimplifyResponse(
            english=result["english"],
            translated=result.get("translated"),
            language=result["language"],
            language_name=result["language_name"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error simplifying syllabus {syllabus_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to simplify syllabus: {str(e)}")


@router.post("/{syllabus_id}/pdf", response_class=Response)
async def generate_simplified_pdf_by_id(
    syllabus_id: str,
    request: SimplifyFromIdRequest,
    authorization: str = Header(None)
):
    """
    Generate a simplified PDF for a syllabus by its ID.
    
    Fetches the syllabus data from Supabase and generates a downloadable PDF.
    """
    try:
        # Verify user (optional)
        user = verify_user(authorization)
        
        # Validate target language
        if request.target_language not in SUPPORTED_LANGUAGES:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported language: {request.target_language}"
            )
        
        # Get Supabase client
        supabase = supabase_service.supabase
        
        # Fetch syllabus data from Supabase
        syllabus_result = supabase.table("sillabi").select("*").eq("file_id", syllabus_id).single().execute()
        
        if not syllabus_result.data:
            raise HTTPException(status_code=404, detail="Syllabus not found")
        
        syllabus_meta = syllabus_result.data
        
        # Then get all calendar items for this syllabus
        items_result = supabase.table("calendar_items").select("event_json, type").eq("syllabus_id", syllabus_id).execute()
        
        # Combine into a structure for the simplifier
        syllabus_data = {
            "course_name": syllabus_meta.get("course_name"),
            "pdf_url": syllabus_meta.get("pdf_url"),
            "extracted_data": syllabus_meta.get("extracted_data"),
            "calendar_events": [item["event_json"] for item in (items_result.data or [])],
            "event_types": {item["event_json"].get("summary", ""): item["type"] for item in (items_result.data or [])}
        }
        
        # Generate simplified PDF
        result = create_simplified_pdf(
            syllabus_data=syllabus_data,
            target_language=request.target_language,
            original_filename=syllabus_meta.get("course_name")
        )
        
        # Create filename
        course_name = syllabus_meta.get("course_name", "syllabus")
        safe_course_name = "".join(c for c in course_name if c.isalnum() or c in (' ', '-', '_')).strip()
        lang_suffix = f"_{request.target_language}" if request.target_language != "en" else ""
        filename = f"simplified_{safe_course_name}{lang_suffix}.pdf"
        
        return Response(
            content=result["pdf_bytes"],
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error generating PDF for syllabus {syllabus_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {str(e)}")
