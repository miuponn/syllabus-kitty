from fastapi import APIRouter, HTTPException, Header
from fastapi.responses import JSONResponse
from fastapi.responses import StreamingResponse, Response
from pydantic import BaseModel

from typing import Optional, Dict, Any, List
import uuid
from datetime import datetime
import json
import tempfile
import os
import google.generativeai as genai
import requests
import io

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

from services.supabase_service import supabase_service

from services.simplified_syllabus_service import (
    create_and_translate_simplified_syllabus,
    create_simplified_syllabus,
    translate_simplified_syllabus,
    markdown_to_pdf,
    get_supported_languages
)

from config import settings

router = APIRouter(prefix="/api/extension", tags=["extension"])

# Configure Gemini
genai.configure(api_key=settings.gemini_api_key)


class TextImportRequest(BaseModel):
    source_url: str
    title: str
    extracted_text: str

class PdfImportRequest(BaseModel):
    source_url: str
    pdf_url: str
    title: str

class ImportResponse(BaseModel):
    success: bool
    import_id: str
    message: str
    syllabus_id: Optional[str] = None
    syllabus_data: Optional[Dict[str, Any]] = None
    calendar_events: Optional[List[Dict[str, Any]]] = None

class SimplifyRequest(BaseModel):
    syllabus_data: Dict[str, Any]
    title: str

class TranslateRequest(BaseModel):
    simplified_content: str
    target_language: str

class AddToCalendarRequest(BaseModel):
    calendar_name: str
    events: List[Dict[str, Any]]

class GeneratePDFRequest(BaseModel):
    markdown_content: str
    title: str

def verify_user(authorization: str = None) -> Optional[Dict[str, Any]]:
    if not authorization:
        return None
    token = authorization.replace("Bearer ", "")
    return supabase_service.verify_jwt(token)


def build_text_extraction_prompt() -> str:
    return """
You are an expert at extracting structured information from academic syllabus text.

You MUST return EXACTLY THREE JSON OBJECTS inside a JSON ARRAY.
Do NOT include markdown, comments, or explanations.

========================
OVERALL RESPONSE FORMAT
========================

[
  ORIGINAL_EXTRACTION_OBJECT,
  ASSESSMENT_CALENDAR_EVENTS_OBJECT,
  RECURRING_CALENDAR_EVENTS_OBJECT
]

========================
OBJECT 1: ORIGINAL EXTRACTION OBJECT
========================

Extract the following structured data:

{
  "language": "en",
  "institution": {
    "name": "string",
    "city": "string (optional)",
    "country": "string (optional)"
  },
  "date": {
    "term": "string (e.g., Fall, Winter, Spring, Summer)",
    "year": number
  },
  "extracted_sections": {
    "title": [{"text": "string"}],
    "code": [{"text": "string"}],
    "instructor": [{"text": "string"}],
    "instructor_email": [{"text": "string"}],
    "class_days": [{"text": "string"}],
    "class_time": [{"text": "string"}],
    "class_location": [{"text": "string"}],
    "office_hours_days": [{"text": "string"}],
    "office_hours_times": [{"text": "string"}],
    "description": [{"text": "string"}],
    "learning_outcomes": [{"text": "string"}]
  },
  "class_schedule": {
    "timezone": "America/Toronto",
    "events": [
      {
        "type": "string (Lecture, Lab, Tutorial, etc.)",
        "days": [0-6],
        "time": {
          "start": "HH:MM (24-hour)",
          "end": "HH:MM (24-hour)"
        },
        "location": "string"
      }
    ]
  },
  "grading_scheme": {
    "assessments": [
      {
        "title": "string",
        "type": "string (Assignment, Exam, Quiz, etc.)",
        "due_date": "YYYY-MM-DD",
        "due_time": "HH:MM (optional)",
        "weight": number (0-100),
        "description": "string (optional)"
      }
    ],
    "total_weight": number,
    "late_policy": "string"
  }
}

========================
OBJECT 2: ASSESSMENT CALENDAR EVENTS (for one-time events)
========================

{
  "course_name": "string",
  "events": [
    {
      "summary": "📝 COURSE_CODE - Assessment Title",
      "description": "string",
      "start": {
        "dateTime": "ISO 8601 datetime",
        "timeZone": "America/Toronto"
      },
      "end": {
        "dateTime": "ISO 8601 datetime (1 hour after start)",
        "timeZone": "America/Toronto"
      }
    }
  ]
}

Summary MUST start with "📝 " for assessments.

========================
OBJECT 3: RECURRING CALENDAR EVENTS (for classes)
========================

{
  "course_name": "string",
  "events": [
    {
      "summary": "📚 COURSE_CODE - Type",
      "description": "string",
      "start": {
        "dateTime": "ISO 8601 datetime",
        "timeZone": "America/Toronto"
      },
      "end": {
        "dateTime": "ISO 8601 datetime",
        "timeZone": "America/Toronto"
      },
      "recurrence": [
        "RRULE:FREQ=WEEKLY;BYDAY=MO,WE;COUNT=15"
      ],
      "location": "string"
    }
  ]
}

Summary MUST start with "📚 " for recurring classes.

========================
EXTRACTION RULES
========================

1. Convert day names to numbers: Sunday=0, Monday=1, Tuesday=2, Wednesday=3, Thursday=4, Friday=5, Saturday=6
2. Convert all times to 24-hour format
3. Extract ALL assessments with weights and due dates
4. Extract ALL recurring events (lectures, labs, tutorials)
5. If information is missing, omit the field
6. All output must be valid JSON

Return ONLY the JSON array, nothing else.
"""


async def extract_syllabus_from_text(text: str, title: str = "") -> Dict[str, Any]:
    """Extract syllabus info from text using Gemini."""
    model = genai.GenerativeModel(model_name=settings.gemini_model_id)
    
    prompt = build_text_extraction_prompt()
    
    full_prompt = f"""
{prompt}

========================
SYLLABUS TEXT TO EXTRACT FROM:
========================
Title: {title}

{text[:50000]}
"""
    
    response = model.generate_content(full_prompt)
    
    cleaned_text = response.text.strip()
    if cleaned_text.startswith("```json"):
        cleaned_text = cleaned_text[7:]
    elif cleaned_text.startswith("```"):
        cleaned_text = cleaned_text[3:]
    if cleaned_text.endswith("```"):
        cleaned_text = cleaned_text[:-3]
    
    cleaned_text = cleaned_text.strip()
    
    try:
        data = json.loads(cleaned_text)
        return data
    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse Gemini response: {e}")


async def store_extension_calendar_items(
    import_id: str,
    user_id: str,
    assessment_events: Dict[str, Any],
    recurring_events: Dict[str, Any],
    course_name: str
) -> None:
    """Store calendar items in Supabase."""
    items_to_insert = []
    
    for event in assessment_events.get('events', []):
        items_to_insert.append({
            'user_id': user_id,
            'syllabus_id': import_id,
            'type': 'assessment',
            'event_json': event,
            'course_name': course_name
        })
    
    for event in recurring_events.get('events', []):
        items_to_insert.append({
            'user_id': user_id,
            'syllabus_id': import_id,
            'type': 'recurring_event',
            'event_json': event,
            'course_name': course_name
        })
    
    if items_to_insert:
        try:
            response = supabase_service.supabase.table('calendar_items').insert(items_to_insert).execute()
            if not response.data:
                raise Exception("No data returned")
        except Exception as e:
            print(f"[ext] Batch insert failed: {e}, trying individual inserts")
            successful = 0
            for item in items_to_insert:
                try:
                    if supabase_service.supabase.table('calendar_items').insert(item).execute().data:
                        successful += 1
                except Exception as err:
                    print(f"[ext] Insert failed: {err}")
            if successful == 0:
                raise


async def download_pdf_text(pdf_url: str) -> str:
    """Download PDF and extract text via Gemini."""
    response = requests.get(pdf_url, timeout=30)
    response.raise_for_status()
    
    with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp_file:
        tmp_file.write(response.content)
        tmp_path = tmp_file.name
    
    try:
        file = genai.upload_file(path=tmp_path, display_name="syllabus.pdf")
        model = genai.GenerativeModel(model_name=settings.gemini_model_id)
        response = model.generate_content([
            file,
            "Extract all text from this PDF. Return only the text content, no formatting or explanation."
        ])
        return response.text
    finally:
        os.unlink(tmp_path)


@router.post("/import-text", response_model=ImportResponse)
async def import_text(
    request: TextImportRequest,
):
    """Import text content from web page."""
    try:
        import_id = str(uuid.uuid4())
        
        print(f"[ext] Text import: {request.title} ({len(request.extracted_text)} chars)")
        
        extraction_result = await extract_syllabus_from_text(
            request.extracted_text,
            request.title
        )
        
        # The result should be an array of 3 objects
        if isinstance(extraction_result, list) and len(extraction_result) >= 3:
            syllabus_data = extraction_result[0]
            assessment_events = extraction_result[1]
            recurring_events = extraction_result[2]
        else:
            syllabus_data = extraction_result
            assessment_events = {"events": []}
            recurring_events = {"events": []}
        
        # Add metadata
        syllabus_data['source_url'] = request.source_url
        syllabus_data['imported_at'] = datetime.utcnow().isoformat()
        syllabus_data['import_type'] = 'extension_text'
        
        all_events = []
        if assessment_events and assessment_events.get('events'):
            all_events.extend(assessment_events['events'])
        if recurring_events and recurring_events.get('events'):
            all_events.extend(recurring_events['events'])
        
        syllabus_id = import_id
        
        return ImportResponse(
            success=True,
            import_id=import_id,
            message=f"Successfully processed: {request.title}",
            syllabus_id=syllabus_id,
            syllabus_data=syllabus_data,
            calendar_events=all_events
        )
        
    except Exception as e:
        print(f"[ext] Import error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/import-pdf-url", response_model=ImportResponse)
async def import_pdf_url(
    request: PdfImportRequest,
):
    """Import PDF via URL."""
    try:
        import_id = str(uuid.uuid4())
        
        print(f"[ext] PDF import: {request.title}")
        pdf_text = await download_pdf_text(request.pdf_url)
        print(f"[ext] Extracted {len(pdf_text)} chars from PDF")
        
        extraction_result = await extract_syllabus_from_text(
            pdf_text,
            request.title
        )
        
        if isinstance(extraction_result, list) and len(extraction_result) >= 3:
            syllabus_data = extraction_result[0]
            assessment_events = extraction_result[1]
            recurring_events = extraction_result[2]
        else:
            syllabus_data = extraction_result
            assessment_events = {"events": []}
            recurring_events = {"events": []}
        
        syllabus_data['source_url'] = request.source_url
        syllabus_data['pdf_url'] = request.pdf_url
        syllabus_data['imported_at'] = datetime.utcnow().isoformat()
        syllabus_data['import_type'] = 'extension_pdf'
        
        all_events = []
        if assessment_events and assessment_events.get('events'):
            all_events.extend(assessment_events['events'])
        if recurring_events and recurring_events.get('events'):
            all_events.extend(recurring_events['events'])
        
        syllabus_id = import_id

        return ImportResponse(
            success=True,
            import_id=import_id,
            message=f"Successfully processed PDF: {request.title}",
            syllabus_id=syllabus_id,
            syllabus_data=syllabus_data,
            calendar_events=all_events
        )
        
    except requests.RequestException as e:
        print(f"[ext] PDF download failed: {e}")
        raise HTTPException(status_code=400, detail=f"PDF download failed: {e}")
    except Exception as e:
        print(f"[ext] PDF import error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/import/{import_id}")
async def get_import_status(import_id: str):
    """Get import status and calendar items."""
    try:
        response = supabase_service.supabase.table('calendar_items').select(
            '*'
        ).eq('syllabus_id', import_id).execute()
        
        if response.data and len(response.data) > 0:
            assessment_events = []
            recurring_events = []
            course_name = response.data[0].get('course_name', 'Unknown Course')
            
            for item in response.data:
                if item.get('type') == 'assessment':
                    assessment_events.append(item.get('event_json'))
                else:
                    recurring_events.append(item.get('event_json'))
            
            return {
                "import_id": import_id,
                "status": "completed",
                "syllabus_id": import_id,
                "course_name": course_name,
                "calendar_events": assessment_events + recurring_events,
                "assessment_count": len(assessment_events),
                "recurring_count": len(recurring_events),
                "created_at": response.data[0].get('created_at')
            }
        
        return {
            "import_id": import_id,
            "status": "not_found",
            "message": "Import not found or not yet processed"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/simplify")
async def simplify_syllabus(
    request: SimplifyRequest,
):
    """Create simplified syllabus."""
    try:
        simplified_markdown = create_simplified_syllabus(
            request.syllabus_data,
            request.title
        )
        return {
            "success": True,
            "simplified": simplified_markdown,
            "message": "Syllabus simplified successfully",
            }
    except Exception as e:
        print(f"[ext] Simplify error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/translate")
async def translate_content(
    request: TranslateRequest,
):
    """Translate given content to target language."""
    try:
        translated_markdown = translate_simplified_syllabus(
            request.simplified_content,
            request.target_language
        )
        return {
            "success": True,
            "translated": translated_markdown,
            "language": request.target_language,
            "message": f"Content translated to {request.target_language} successfully"
        }
    except ValueError as e:
        # Invalid language code
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"[ext] Translate error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
@router.post("/add-to-calendar")
async def add_to_calendar(
    request: AddToCalendarRequest,
    x_google_access_token: str = Header(..., description="Google OAuth token from chrome.identity")
    
):
    """Add events to user's Google Calendar."""
    try:
        # Create credentials from token
        creds = Credentials(token=x_google_access_token)

        # Build the calendar API service
        service = build('calendar', 'v3', credentials=creds)
        
        # Create new calendar
        calendar_body = {
            'summary': request.calendar_name,
            'description': 'Calendar created by Syllabus Kitty Chrome Extension',
            'timeZone': 'America/Toronto'
        }
        created_calendar = service.calendars().insert(body=calendar_body).execute()
        calendar_id = created_calendar['id']

        print(f"[ext] Created calendar: {request.calendar_name} ({calendar_id})")

        # Add each event to the calendar
        events_added = 0
        events_failed = []

        for event in request.events:
            try:
                service.events().insert(
                    calendarId=calendar_id,
                    body=event
                ).execute()
                events_added += 1
            except Exception as e:
                events_failed.append({
                    'event': event.get('summary', 'Unnamed Event'),
                    'error': str(e)
                })
                print(f"[ext] Failed to add event: {event.get('summary', 'Unnamed Event')} - {e}")
        
        # Return results
        return {
            "success": True,
            "calendar_id": calendar_id,
            "calendar_name": request.calendar_name,
            "calendar_url": f"https://calendar.google.com/calendar/r?cid={calendar_id}",
            "events_added": events_added,
            "events_failed": len(events_failed),
            "failed_details": events_failed if events_failed else None,
            "message": f"Added {events_added} events to calendar '{request.calendar_name}'."
        }
    except Exception as e:
        print(f"[ext] Add to calendar error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
@router.post("/generate-pdf")
async def generate_pdf(
    request: GeneratePDFRequest,
):
    """Generate PDF from markdown content."""
    try:
        pdf_bytes = markdown_to_pdf(
            request.markdown_content,
            request.title
        )
        # Create safe filename
        safe_filename = request.title.replace(" ", "_").replace("/", "_")

        return Response(
            content=pdf_bytes,
            media_type='application/pdf',
            headers={
                'Content-Disposition': f'attachment; filename="{safe_filename}.pdf"'
            }
        )
    except Exception as e:
        print(f"[ext] PDF generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/languages")
async def get_languages():
    """Get supported translation languages."""
    return {"languages": get_supported_languages()}

@router.get("/app-url")
async def get_app_url(
    syllabus_id: str,
    view: str = "original"
):
    """Generate URL to open syllabus in web app."""
    base_url = settings.frontend_url

    return{
        "url": f"{base_url}/syllabus/{syllabus_id}?view={view}",
        "syllabus_id": syllabus_id,
        "view": view
    }