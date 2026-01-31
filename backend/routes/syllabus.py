from fastapi import APIRouter, UploadFile, File, HTTPException, Header, Depends
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Dict, Any, Optional
import aiofiles
import os
from pathlib import Path
import uuid
from datetime import datetime, timedelta
import json
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

from services.gemini_service import gemini_service
from services.supabase_service import supabase_service
from config import settings


router = APIRouter(prefix="/api/syllabus", tags=["syllabus"])
security = HTTPBearer()


@router.post("/upload")
async def upload_syllabus(
    file: UploadFile = File(...),
    credentials: HTTPAuthorizationCredentials = Depends(security),
    x_google_access_token: Optional[str] = Header(None),
    x_google_refresh_token: Optional[str] = Header(None),
) -> JSONResponse:
    """
    Upload a syllabus PDF and extract structured information using Gemini AI
    
    Requires Supabase JWT authentication. Optionally creates Google Calendar events
    if the user has connected their Google account via Supabase Auth.
    
    Args:
        file: PDF file to process
        credentials: Supabase JWT token from Authorization header
        x_google_access_token: Optional Google access token from frontend
        x_google_refresh_token: Optional Google refresh token from frontend
        
    Returns:
        Extracted syllabus information as JSON, optionally with calendar events
    """
    # Step 1: Verify Supabase JWT and extract user info
    jwt_payload = supabase_service.verify_jwt(credentials.credentials)
    if not jwt_payload:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication token"
        )
    
    user_id = jwt_payload.get('sub')
    user_email = jwt_payload.get('email', 'Unknown')
    
    print(f"✅ Authenticated user: {user_email} (ID: {user_id})")
    
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
        
        # Skip Gemini processing for now - use dummy Google Calendar events for testing
        print(f"📤 File saved: {file.filename} (skipping Gemini for testing)")
        
        # Create dummy Google Calendar events in the correct API format
        # Base dates for events
        base_date = datetime(2026, 2, 3, 10, 0)  # Feb 3, 2026 at 10:00 AM
        
        dummy_events = [
            # Monday/Wednesday Lectures
            {
                'summary': '📚 CSI 1234 - Lecture',
                'description': 'Introduction to Computer Science\nInstructor: Dr. Jane Smith\nLocation: SITE 5084',
                'start': {
                    'dateTime': base_date.isoformat(),
                    'timeZone': 'America/Toronto',
                },
                'end': {
                    'dateTime': (base_date + timedelta(hours=1, minutes=30)).isoformat(),
                    'timeZone': 'America/Toronto',
                },
                'recurrence': ['RRULE:FREQ=WEEKLY;BYDAY=MO,WE;UNTIL=20260410T235959Z'],
                'location': 'SITE 5084',
            },
            # Friday Labs
            {
                'summary': '🔬 CSI 1234 - Lab',
                'description': 'Introduction to Computer Science Lab\nInstructor: TA John Doe\nLocation: SITE 2052',
                'start': {
                    'dateTime': datetime(2026, 2, 7, 14, 30).isoformat(),
                    'timeZone': 'America/Toronto',
                },
                'end': {
                    'dateTime': datetime(2026, 2, 7, 16, 0).isoformat(),
                    'timeZone': 'America/Toronto',
                },
                'recurrence': ['RRULE:FREQ=WEEKLY;BYDAY=FR;UNTIL=20260410T235959Z'],
                'location': 'SITE 2052',
            },
            # Assignment 1 Due
            {
                'summary': '📝 Assignment 1 Due (15%)',
                'description': 'Introduction to Python programming\nWeight: 15%\nDue: 11:59 PM',
                'start': {
                    'dateTime': datetime(2026, 2, 14, 23, 59).isoformat(),
                    'timeZone': 'America/Toronto',
                },
                'end': {
                    'dateTime': datetime(2026, 2, 15, 0, 59).isoformat(),
                    'timeZone': 'America/Toronto',
                },
                'reminders': {
                    'useDefault': False,
                    'overrides': [
                        {'method': 'email', 'minutes': 24 * 60},  # 1 day before
                        {'method': 'popup', 'minutes': 60},       # 1 hour before
                    ],
                },
            },
            # Midterm Exam
            {
                'summary': '📖 Midterm Exam (25%)',
                'description': 'Covers weeks 1-6\nWeight: 25%\nTime: 10:00 AM',
                'start': {
                    'dateTime': datetime(2026, 3, 7, 10, 0).isoformat(),
                    'timeZone': 'America/Toronto',
                },
                'end': {
                    'dateTime': datetime(2026, 3, 7, 12, 0).isoformat(),
                    'timeZone': 'America/Toronto',
                },
                'reminders': {
                    'useDefault': False,
                    'overrides': [
                        {'method': 'email', 'minutes': 24 * 60},  # 1 day before
                        {'method': 'popup', 'minutes': 120},      # 2 hours before
                    ],
                },
            },
            # Final Project Due
            {
                'summary': '🚀 Final Project Due (30%)',
                'description': 'Build a complete application\nWeight: 30%\nDue: 11:59 PM',
                'start': {
                    'dateTime': datetime(2026, 4, 4, 23, 59).isoformat(),
                    'timeZone': 'America/Toronto',
                },
                'end': {
                    'dateTime': datetime(2026, 4, 5, 0, 59).isoformat(),
                    'timeZone': 'America/Toronto',
                },
                'reminders': {
                    'useDefault': False,
                    'overrides': [
                        {'method': 'email', 'minutes': 7 * 24 * 60},  # 1 week before
                        {'method': 'email', 'minutes': 24 * 60},      # 1 day before
                        {'method': 'popup', 'minutes': 60},           # 1 hour before
                    ],
                },
            },
            # Final Exam
            {
                'summary': '📋 Final Exam (30%)',
                'description': 'Comprehensive final exam\nWeight: 30%\nTime: 9:00 AM',
                'start': {
                    'dateTime': datetime(2026, 4, 18, 9, 0).isoformat(),
                    'timeZone': 'America/Toronto',
                },
                'end': {
                    'dateTime': datetime(2026, 4, 18, 12, 0).isoformat(),
                    'timeZone': 'America/Toronto',
                },
                'reminders': {
                    'useDefault': False,
                    'overrides': [
                        {'method': 'email', 'minutes': 7 * 24 * 60},  # 1 week before
                        {'method': 'email', 'minutes': 24 * 60},      # 1 day before
                        {'method': 'popup', 'minutes': 120},          # 2 hours before
                    ],
                },
            }
        ]
        
        extracted_data = {
            "course_name": "CSI 1234 - Introduction to Computer Science",
            "events": dummy_events
        }
        print(f"✅ Generated {len(dummy_events)} dummy calendar events for testing")
        
        # Step 2: Try to get Google tokens and create calendar events
        google_credentials = None
        calendar_events_created = False
        calendar_info = None
        
        # First, try tokens from frontend headers (most direct)
        if x_google_access_token:
            print(f"🔑 Using Google tokens from frontend headers")
            google_credentials = Credentials(
                token=x_google_access_token,
                refresh_token=x_google_refresh_token,
                token_uri='https://oauth2.googleapis.com/token',
                scopes=['https://www.googleapis.com/auth/calendar']
            )
        else:
            # Fallback: Try to fetch from Supabase auth tables
            print(f"🔍 Fetching Google tokens from Supabase for user {user_id}")
            google_credentials = supabase_service.get_google_tokens(user_id)
            
            if not google_credentials:
                # Try direct query as fallback
                google_credentials = supabase_service.get_google_tokens_direct_query(user_id)
        
        # If we have Google credentials, create calendar events
        if google_credentials:
            try:
                print(f"📅 Creating Google Calendar events...")
                calendar_info = await create_calendar_events(
                    google_credentials, 
                    extracted_data,
                    user_email
                )
                calendar_events_created = True
                print(f"✅ Successfully created {len(calendar_info.get('created_events', []))} calendar events")
            except Exception as e:
                print(f"❌ Failed to create calendar events: {e}")
                calendar_info = {"error": str(e)}
        else:
            print(f"ℹ️ No Google tokens available - skipping calendar creation")
        
        # Add metadata
        result = {
            "file_id": file_id,
            "filename": file.filename,
            "uploaded_at": timestamp,
            "user_id": user_id,
            "user_email": user_email,
            "extracted_data": extracted_data,
            "calendar": {
                "events_created": calendar_events_created,
                "info": calendar_info
            }
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


async def create_calendar_events(
    google_credentials: Credentials,
    syllabus_data: Dict[str, Any],
    user_email: str
) -> Dict[str, Any]:
    """
    Create Google Calendar events from ready-to-use event data
    
    Args:
        google_credentials: Google OAuth credentials
        syllabus_data: Contains course_name and events list
        user_email: User's email for calendar naming
        
    Returns:
        Dictionary with calendar creation results
    """
    # Build Google Calendar service
    service = build('calendar', 'v3', credentials=google_credentials)
    
    course_name = syllabus_data.get('course_name', 'Course Calendar')
    events = syllabus_data.get('events', [])
    
    # Use primary calendar instead of creating new one (works with limited scope)
    calendar_id = 'primary'
    
    # Create events directly in primary calendar
    created_events = []
    failed_events = []
    
    for event_data in events:
        try:
            created_event = service.events().insert(
                calendarId=calendar_id,
                body=event_data
            ).execute()
            
            created_events.append({
                'id': created_event['id'],
                'summary': created_event['summary'],
                'start': created_event['start'],
                'html_link': created_event.get('htmlLink')
            })
        except Exception as e:
            failed_events.append({
                'summary': event_data.get('summary', 'Unknown Event'),
                'error': str(e)
            })
    
    return {
        'calendar_id': calendar_id,
        'calendar_name': f"{course_name} (in Primary Calendar)",
        'calendar_link': f"https://calendar.google.com/calendar/u/0/r",
        'created_events': created_events,
        'failed_events': failed_events,
        'total_events': len(created_events),
        'total_failures': len(failed_events)
    }


@router.get("/health")
async def health_check() -> Dict[str, str]:
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "syllabus-extraction",
        "model": settings.gemini_model_id
    }
