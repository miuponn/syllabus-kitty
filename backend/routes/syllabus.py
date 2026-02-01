from fastapi import APIRouter, UploadFile, File, HTTPException, Header, Depends, Body
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Dict, Any, Optional
import aiofiles
import os
from pathlib import Path
import uuid
from datetime import datetime, timedelta
import json
import re
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

from services.gemini_service import gemini_service
from services.supabase_service import supabase_service
from services.email_notification_service import email_notification_service
from services.gmail_notification_service import gmail_notification_service
from config import settings


router = APIRouter(prefix="/api/syllabus", tags=["syllabus"])
security = HTTPBearer()


@router.post("/upload")
async def upload_syllabus(
    file: UploadFile = File(...),
    credentials: HTTPAuthorizationCredentials = Depends(security),
    preview_only: bool = True,  # Default to preview mode
) -> JSONResponse:
    """
    Upload a syllabus PDF and extract structured information using Gemini AI
    
    Args:
        file: PDF file to process
        credentials: Supabase JWT token from Authorization header
        preview_only: If True, only extract events for preview. If False, also create calendar.
        
    Returns:
        Extracted syllabus information with events for user review
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
        
        print(f"📤 File saved: {file.filename}")
        
        # Process syllabus with Gemini AI
        print(f"🤖 Processing syllabus with Gemini AI...")
        
        try:
            # Upload file to Gemini
            gemini_file = await gemini_service.upload_file(
                str(file_path), 
                display_name=file.filename
            )
            print(f"✅ File uploaded to Gemini: {gemini_file.name}")
            
            # Extract syllabus information
            gemini_response = await gemini_service.extract_syllabus_info(gemini_file)
            print(f"✅ Gemini extraction completed")
            
            # The response should be a JSON array with 3 objects:
            # [original_extraction, assessment_events, recurring_events]
            if isinstance(gemini_response, list) and len(gemini_response) >= 2:
                original_extraction = gemini_response[0]
                assessment_events = gemini_response[1] if len(gemini_response) > 1 else {"course_name": "Unknown Course", "events": []}
                recurring_events = gemini_response[2] if len(gemini_response) > 2 else {"course_name": "Unknown Course", "events": []}
                
                # Combine all events for calendar creation
                all_events = []
                all_events.extend(assessment_events.get('events', []))
                all_events.extend(recurring_events.get('events', []))
                
                # Get course name from any available source
                course_name = (
                    assessment_events.get('course_name') or 
                    recurring_events.get('course_name') or
                    original_extraction.get('course_name') or
                    "Extracted Course"
                )
                
                extracted_data = {
                    "course_name": course_name,
                    "events": all_events,
                    "original_extraction": original_extraction,
                    "assessment_events": assessment_events,
                    "recurring_events": recurring_events
                }
                
                print(f"✅ Extracted {len(all_events)} calendar events from syllabus")
                
            else:
                # Fallback: treat as single object with events
                if isinstance(gemini_response, dict):
                    events = gemini_response.get('events', [])
                    course_name = gemini_response.get('course_name', 'Extracted Course')
                    
                    extracted_data = {
                        "course_name": course_name,
                        "events": events,
                        "original_extraction": gemini_response
                    }
                    
                    print(f"✅ Extracted {len(events)} calendar events from syllabus")
                else:
                    raise ValueError(f"Unexpected Gemini response format: {type(gemini_response)}")
            
        except Exception as e:
            print(f"❌ Gemini processing failed: {e}")
            # Fallback to empty extraction
            extracted_data = {
                "course_name": "Processing Failed",
                "events": [],
                "error": str(e)
            }
        
        # Add metadata and return for preview
        result = {
            "file_id": file_id,
            "filename": file.filename,
            "uploaded_at": timestamp,
            "user_id": user_id,
            "user_email": user_email,
            "extracted_data": extracted_data,
            "preview_mode": preview_only,
            "message": "Events extracted successfully. Review and select events to add to calendar." if preview_only else None
        }

        # Store extracted data in Supabase
        try:
            await store_calendar_items_in_db(file_id, user_id, extracted_data)
            print(f"✅ Stored calendar items in database for file {file_id}")
        except Exception as e:
            print(f"⚠️ Failed to store calendar items in database: {e}")
            # Don't fail the request if database storage fails
        
        # Return for user review if in preview mode
        if preview_only:
            return JSONResponse(
                status_code=200,
                content=result
            )
        
        # If not preview mode, this should not be reached in normal flow
        # (Users should use /create-calendar endpoint instead)
        result["message"] = "Events extracted. Use /create-calendar endpoint to create calendar with selected events."
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


@router.get("/{file_id}")
async def get_syllabus_by_id(
    file_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> JSONResponse:
    """
    Get previously processed syllabus data by file ID
    
    Args:
        file_id: The file ID from the upload response
        credentials: Supabase JWT token
        
    Returns:
        Syllabus data in frontend-friendly format
    """
    # Verify Supabase JWT
    jwt_payload = supabase_service.verify_jwt(credentials.credentials)
    if not jwt_payload:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication token"
        )
    
    user_id = jwt_payload.get('sub')
    
    # Fetch real data from Supabase database
    try:
        calendar_items = await get_calendar_items_from_db(file_id, user_id)
        
        if not calendar_items:
            raise HTTPException(
                status_code=404,
                detail="Syllabus not found or you don't have permission to access it"
            )
        
        # Transform database items back to frontend format
        frontend_data = transform_db_items_for_frontend(calendar_items)
        
        response = {
            "file_id": file_id,
            "filename": calendar_items[0].get('filename', 'unknown.pdf'),
            "uploaded_at": calendar_items[0].get('uploaded_at', datetime.now().strftime("%Y%m%d_%H%M%S")),
            "user_id": user_id,
            "user_email": jwt_payload.get('email', 'Unknown'),
            "pdf_url": f"https://your-storage-bucket.com/uploads/{file_id}.pdf",  # TODO: Implement file URL generation
            "frontend_data": frontend_data,
            "message": "Syllabus data loaded successfully"
        }
        
        return JSONResponse(
            status_code=200,
            content=response
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching syllabus data: {e}")
        raise HTTPException(
            status_code=500,
            detail="Error retrieving syllabus data"
        )


@router.post("/{file_id}/add-to-calendar")
async def add_to_calendar_by_file_id(
    file_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    x_google_access_token: Optional[str] = Header(None),
    x_google_refresh_token: Optional[str] = Header(None),
    request_data: Dict[str, Any] = Body(default={}),
) -> JSONResponse:
    """
    Create Google Calendar with all events from a specific syllabus file
    
    Args:
        file_id: The syllabus file ID from the URL path
        credentials: Supabase JWT token
        x_google_access_token: Google access token from frontend
        x_google_refresh_token: Google refresh token from frontend
        request_data: Optional JSON body with course_name override or event selections
        
    Returns:
        Calendar creation results
    """
    # Verify Supabase JWT
    jwt_payload = supabase_service.verify_jwt(credentials.credentials)
    if not jwt_payload:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication token"
        )
    
    user_id = jwt_payload.get('sub')
    user_email = jwt_payload.get('email', 'Unknown')
    user_name = jwt_payload.get('user_metadata', {}).get('full_name', 'Student')
    
    # Validate Google tokens
    if not x_google_access_token:
        raise HTTPException(
            status_code=400,
            detail="Google access token required for calendar creation"
        )
    
    # Create Google credentials
    google_credentials = Credentials(
        token=x_google_access_token,
        refresh_token=x_google_refresh_token,
        token_uri='https://oauth2.googleapis.com/token',
        scopes=[
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/gmail.send'
        ]
    )
    
    try:
        # Fetch events from Supabase database
        print(f"🔍 Fetching calendar events from database for file {file_id}")
        calendar_items = await get_calendar_items_from_db(file_id, user_id)
        
        if not calendar_items:
            raise HTTPException(
                status_code=404,
                detail="No calendar events found for this syllabus"
            )
        
        # Get course name from request, database, or extract from events
        course_name = request_data.get('course_name')
        if not course_name and calendar_items:
            # First try to get course_name from database
            course_name = calendar_items[0].get('course_name')
        
        if not course_name:
            # Fallback: extract course name from first event summary
            if calendar_items:
                first_event = calendar_items[0]['event_json']
                if 'summary' in first_event:
                    course_match = re.search(r'([A-Z]{2,4}\s*\d{3,4})', first_event['summary'])
                    course_name = course_match.group(1) if course_match else "Course Calendar"
                else:
                    course_name = "Course Calendar"
            else:
                course_name = "Course Calendar"
        
        # Convert database items back to Google Calendar format
        google_calendar_events = convert_db_items_to_google_format(calendar_items)
        
        if not google_calendar_events:
            raise HTTPException(
                status_code=400,
                detail="No valid events found to create calendar"
            )
        
        print(f"📅 Creating calendar '{course_name}' with {len(google_calendar_events)} events for user {user_email}")
        
        # Create calendar with events from database
        calendar_info = await create_calendar_events(
            google_credentials,
            {"course_name": course_name, "events": google_calendar_events},
            user_email
        )
        
        # Set up Gmail notifications after calendar creation
        try:
            notification_result = await gmail_notification_service.setup_notifications_from_calendar_events(
                google_credentials=google_credentials,
                user_email=user_email,
                user_name=user_name or "Student", 
                events=calendar_info.get('created_events', [])
            )
            print(f"📧 Gmail notification setup: {notification_result['message']}")
        except Exception as e:
            print(f"⚠️ Failed to setup Gmail notifications: {e}")
            notification_result = {"success": False, "message": str(e)}
        
        result = {
            "success": True,
            "calendar_info": calendar_info,
            "notification_info": notification_result,
            "course_name": course_name,
            "events_processed": len(google_calendar_events),
            "events_from_database": len(calendar_items),
            "file_id": file_id,
            "user_id": user_id,
            "created_at": datetime.now().isoformat()
        }
        
        return JSONResponse(
            status_code=201,
            content=result
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Calendar creation failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create calendar: {str(e)}"
        )


@router.post("/create-calendar")
async def create_calendar_with_selected_events(
    request_data: Dict[str, Any] = Body(...),
    credentials: HTTPAuthorizationCredentials = Depends(security),
    x_google_access_token: Optional[str] = Header(None),
    x_google_refresh_token: Optional[str] = Header(None),
) -> JSONResponse:
    """
    Create Google Calendar with events from Supabase database
    
    Args:
        request_data: JSON body with course_name, file_id, and optional event selections
        credentials: Supabase JWT token
        x_google_access_token: Google access token from frontend
        x_google_refresh_token: Google refresh token from frontend
        
    Expected request_data format:
    {
        "course_name": "Course Name",
        "file_id": "original file id",
        "selected_event_ids": [list of database IDs to include] // optional - includes all if not provided
    }
    
    Returns:
        Calendar creation results
    """
    # Verify Supabase JWT
    jwt_payload = supabase_service.verify_jwt(credentials.credentials)
    if not jwt_payload:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication token"
        )
    
    user_id = jwt_payload.get('sub')
    user_email = jwt_payload.get('email', 'Unknown')
    
    # Validate Google tokens
    if not x_google_access_token:
        raise HTTPException(
            status_code=400,
            detail="Google access token required for calendar creation"
        )
    
    # Create Google credentials
    google_credentials = Credentials(
        token=x_google_access_token,
        refresh_token=x_google_refresh_token,
        token_uri='https://oauth2.googleapis.com/token',
        scopes=[
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/gmail.send'
        ]
    )
    
    # Extract data from request
    course_name = request_data.get('course_name')
    file_id = request_data.get('file_id')
    selected_event_ids = request_data.get('selected_event_ids')  # Optional - for selective calendar creation
    
    if not file_id:
        raise HTTPException(
            status_code=400,
            detail="file_id is required to fetch events from database"
        )
    
    try:
        # Fetch events from Supabase database
        print(f"🔍 Fetching calendar events from database for file {file_id}")
        calendar_items = await get_calendar_items_from_db(file_id, user_id)
        
        if not calendar_items:
            raise HTTPException(
                status_code=404,
                detail="No calendar events found for this syllabus"
            )
        
        # Get course name from database if not provided in request
        if not course_name and calendar_items:
            course_name = calendar_items[0].get('course_name', 'Course Calendar')
        elif not course_name:
            course_name = 'Course Calendar'
        
        # Filter events if specific IDs were selected
        if selected_event_ids:
            selected_ids_set = set(map(str, selected_event_ids))
            calendar_items = [item for item in calendar_items if str(item['id']) in selected_ids_set]
            print(f"✅ Filtered to {len(calendar_items)} selected events")
        
        # Convert database items back to Google Calendar format
        google_calendar_events = convert_db_items_to_google_format(calendar_items)
        
        if not google_calendar_events:
            raise HTTPException(
                status_code=400,
                detail="No valid events found to create calendar"
            )
        
        print(f"📅 Creating calendar '{course_name}' with {len(google_calendar_events)} events for user {user_email}")
        
        # Create calendar with events from database
        calendar_info = await create_calendar_events(
            google_credentials,
            {"course_name": course_name, "events": google_calendar_events},
            user_email
        )
        
        # Set up Gmail notifications after calendar creation
        try:
            notification_result = await gmail_notification_service.setup_notifications_from_calendar_events(
                google_credentials=google_credentials,
                user_email=user_email,
                user_name=jwt_payload.get('user_metadata', {}).get('full_name', 'Student'),
                events=calendar_info.get('created_events', [])
            )
            print(f"📧 Gmail notification setup: {notification_result['message']}")
        except Exception as e:
            print(f"⚠️ Failed to setup Gmail notifications: {e}")
            notification_result = {"success": False, "message": str(e)}
        
        result = {
            "success": True,
            "calendar_info": calendar_info,
            "notification_info": notification_result,
            "course_name": course_name,
            "events_processed": len(google_calendar_events),
            "events_from_database": len(calendar_items),
            "file_id": file_id,
            "user_id": user_id,
            "created_at": datetime.now().isoformat()
        }
        
        return JSONResponse(
            status_code=201,
            content=result
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Calendar creation failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create calendar: {str(e)}"
        )


async def store_calendar_items_in_db(file_id: str, user_id: str, extracted_data: Dict[str, Any]) -> None:
    """
    Store extracted calendar items in Supabase calendar_items table
    
    Args:
        file_id: The syllabus file ID
        user_id: User ID from JWT
        extracted_data: Extracted data with assessment and recurring events
    """
    items_to_insert = []
    
    # Extract course name from the data
    course_name = extracted_data.get('course_name', 'Unknown Course')
    
    # Store assessment events
    assessment_events = extracted_data.get('assessment_events', {}).get('events', [])
    for event in assessment_events:
        items_to_insert.append({
            'user_id': user_id,
            'syllabus_id': file_id,  # Using file_id as syllabus_id
            'type': 'assessment',
            'event_json': event,
            'course_name': course_name
        })
    
    # Store recurring events
    recurring_events = extracted_data.get('recurring_events', {}).get('events', [])
    for event in recurring_events:
        items_to_insert.append({
            'user_id': user_id,
            'syllabus_id': file_id,  # Using file_id as syllabus_id
            'type': 'recurring_event',
            'event_json': event,
            'course_name': course_name
        })
    
    # Insert all items in batch using service role (bypasses RLS)
    if items_to_insert:
        try:
            # Use the service role client which should bypass RLS policies
            response = supabase_service.supabase.table('calendar_items').insert(items_to_insert).execute()
            if response.data:
                print(f"✅ Stored {len(items_to_insert)} calendar items in database")
            else:
                raise Exception("Failed to insert calendar items - no data returned")
        except Exception as e:
            # If RLS is still blocking, try with explicit RLS bypass
            print(f"⚠️ Initial insert failed, trying with RLS context: {e}")
            
            # Alternative approach: insert items one by one with better error handling
            successful_inserts = 0
            for item in items_to_insert:
                try:
                    single_response = supabase_service.supabase.table('calendar_items').insert(item).execute()
                    if single_response.data:
                        successful_inserts += 1
                except Exception as single_error:
                    print(f"⚠️ Failed to insert single item: {single_error}")
                    continue
            
            if successful_inserts > 0:
                print(f"✅ Stored {successful_inserts}/{len(items_to_insert)} calendar items in database")
            else:
                raise Exception(f"Failed to insert any calendar items: {str(e)}")


async def get_calendar_items_from_db(file_id: str, user_id: str) -> list:
    """
    Retrieve calendar items from Supabase calendar_items table
    
    Args:
        file_id: The syllabus file ID
        user_id: User ID from JWT
        
    Returns:
        List of calendar items from database
    """
    try:
        # Use service role to query (should bypass RLS)
        response = supabase_service.supabase.table('calendar_items').select('*').eq(
            'syllabus_id', file_id
        ).eq(
            'user_id', user_id
        ).execute()
        
        return response.data if response.data else []
    
    except Exception as e:
        print(f"⚠️ Error retrieving calendar items: {e}")
        return []


def convert_db_items_to_google_format(calendar_items: list) -> list:
    """
    Convert database calendar items back to Google Calendar API format
    
    Args:
        calendar_items: List of calendar items from database
        
    Returns:
        List of events in Google Calendar format
    """
    google_events = []
    
    for item in calendar_items:
        # The event_json field already contains the Google Calendar format
        event_json = item.get('event_json', {})
        
        if event_json:
            google_events.append(event_json)
    
    return google_events


def transform_db_items_for_frontend(calendar_items: list) -> Dict[str, Any]:
    """
    Transform database calendar items to frontend format
    
    Args:
        calendar_items: List of calendar items from database
        
    Returns:
        Frontend-friendly data structure
    """
    assessments = []
    recurring_events = []
    course_name = "Unknown Course"
    
    # Separate assessments and recurring events
    assessment_events = [item for item in calendar_items if item['type'] == 'assessment']
    recurring_event_items = [item for item in calendar_items if item['type'] == 'recurring_event']
    
    # Get course name from database first, then fallback to extraction
    if calendar_items:
        # First try to get course_name from database
        course_name = calendar_items[0].get('course_name')
        
        # Fallback: extract from event summary if not in database
        if not course_name:
            first_event = calendar_items[0]['event_json']
            if 'summary' in first_event:
                # Try to extract course code from summary
                course_match = re.search(r'([A-Z]{2,4}\s*\d{3,4})', first_event['summary'])
                if course_match:
                    course_name = course_match.group(1)
        
        # Final fallback
        if not course_name:
            course_name = "Unknown Course"
    
    # Transform assessments
    for i, item in enumerate(assessment_events):
        event = item['event_json']
        
        # Extract weight from summary
        weight_match = re.search(r'\((\d+)%\)', event.get('summary', ''))
        weight = int(weight_match.group(1)) if weight_match else 0
        
        # Determine type from summary
        summary = event.get('summary', '')
        event_type = 'assignment'
        summary_lower = summary.lower()
        if 'exam' in summary_lower:
            event_type = 'exam'
        elif 'quiz' in summary_lower:
            event_type = 'quiz'
        elif 'project' in summary_lower:
            event_type = 'project'
        elif 'midterm' in summary_lower:
            event_type = 'exam'
        elif 'final' in summary_lower:
            event_type = 'exam'
        
        # Clean title
        title = re.sub(r'^[^\w\s]+\s*', '', summary)
        title = re.sub(r'\s*\(\d+%\).*$', '', title)
        
        assessments.append({
            'id': str(item['id']),
            'type': event_type,
            'title': title,
            'weight': weight,
            'due_date': event.get('start', {}).get('dateTime', ''),
            'description': event.get('description', ''),
        })
    
    # Transform recurring events
    for i, item in enumerate(recurring_event_items):
        event = item['event_json']
        
        # Extract day from recurrence rule
        recurrence_rules = event.get('recurrence', [])
        day_of_week = 'Monday'
        
        if recurrence_rules:
            day_pattern = r'BYDAY=([A-Z,]+)'
            day_match = re.search(day_pattern, recurrence_rules[0])
            
            if day_match:
                day_map = {
                    'MO': 'Monday', 'TU': 'Tuesday', 'WE': 'Wednesday', 
                    'TH': 'Thursday', 'FR': 'Friday', 'SA': 'Saturday', 'SU': 'Sunday'
                }
                first_day = day_match.group(1).split(',')[0]
                day_of_week = day_map.get(first_day, 'Monday')
        
        # Determine event type
        summary = event.get('summary', '')
        event_type = 'lecture'
        summary_lower = summary.lower()
        
        if 'lab' in summary_lower:
            event_type = 'lab'
        elif 'tutorial' in summary_lower:
            event_type = 'tutorial'
        elif 'dgd' in summary_lower or 'discussion' in summary_lower:
            event_type = 'dgd'
        
        # Extract times
        start_dt = event.get('start', {}).get('dateTime', '')
        end_dt = event.get('end', {}).get('dateTime', '')
        
        start_time = '10:00'
        end_time = '11:30'
        
        if start_dt:
            try:
                dt = datetime.fromisoformat(start_dt.replace('Z', '+00:00'))
                start_time = dt.strftime('%H:%M')
            except:
                pass
        
        if end_dt:
            try:
                dt = datetime.fromisoformat(end_dt.replace('Z', '+00:00'))
                end_time = dt.strftime('%H:%M')
            except:
                pass
        
        # Clean title
        title = re.sub(r'^[^\w\s]+\s*', '', summary)
        
        recurring_events.append({
            'id': str(item['id']),
            'type': event_type,
            'title': title,
            'day_of_week': day_of_week,
            'start_time': start_time,
            'end_time': end_time,
            'location': event.get('location', ''),
        })
    
    return {
        'course_name': course_name,
        'assessments': assessments,
        'recurring_events': recurring_events,
    }


def transform_for_frontend(extracted_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Transform extracted data into frontend-friendly format
    
    Args:
        extracted_data: Raw extracted data with Google Calendar format
        
    Returns:
        Data formatted for frontend components
    """
    # Get assessment and recurring events
    assessment_events = extracted_data.get('assessment_events', {}).get('events', [])
    recurring_events = extracted_data.get('recurring_events', {}).get('events', [])
    
    # Transform assessments
    assessments = []
    for i, event in enumerate(assessment_events):
        # Extract weight from summary (e.g., "📝 Assignment 1 Due (15%)")
        weight_match = None
        summary = event.get('summary', '')
        
        import re
        weight_pattern = r'\((\d+)%\)'
        weight_match = re.search(weight_pattern, summary)
        weight = int(weight_match.group(1)) if weight_match else 0
        
        # Determine type from summary
        event_type = 'assignment'
        summary_lower = summary.lower()
        if 'exam' in summary_lower:
            event_type = 'exam'
        elif 'quiz' in summary_lower:
            event_type = 'quiz'
        elif 'project' in summary_lower:
            event_type = 'project'
        elif 'midterm' in summary_lower:
            event_type = 'exam'
        elif 'final' in summary_lower:
            event_type = 'exam'
        
        # Clean title (remove emoji and weight)
        title = re.sub(r'^[^\w\s]+\s*', '', summary)  # Remove leading emojis
        title = re.sub(r'\s*\(\d+%\).*$', '', title)  # Remove weight and anything after
        
        assessments.append({
            'id': f'assessment_{i}',
            'type': event_type,
            'title': title,
            'weight': weight,
            'due_date': event.get('start', {}).get('dateTime', ''),
            'description': event.get('description', ''),
        })
    
    # Transform recurring events
    recurring_events_transformed = []
    for i, event in enumerate(recurring_events):
        # Extract day from recurrence rule
        recurrence_rules = event.get('recurrence', [])
        day_of_week = 'Monday'  # default
        
        if recurrence_rules:
            recurrence_rule = recurrence_rules[0]
            day_pattern = r'BYDAY=([A-Z,]+)'
            day_match = re.search(day_pattern, recurrence_rule)
            
            if day_match:
                day_map = {
                    'MO': 'Monday', 'TU': 'Tuesday', 'WE': 'Wednesday', 
                    'TH': 'Thursday', 'FR': 'Friday', 'SA': 'Saturday', 'SU': 'Sunday'
                }
                first_day = day_match.group(1).split(',')[0]
                day_of_week = day_map.get(first_day, 'Monday')
        
        # Determine event type from title
        summary = event.get('summary', '')
        event_type = 'lecture'
        summary_lower = summary.lower()
        
        if 'lab' in summary_lower:
            event_type = 'lab'
        elif 'tutorial' in summary_lower:
            event_type = 'tutorial'
        elif 'dgd' in summary_lower or 'discussion' in summary_lower:
            event_type = 'dgd'
        elif 'seminar' in summary_lower:
            event_type = 'seminar'
        
        # Extract times from datetime strings
        start_dt = event.get('start', {}).get('dateTime', '')
        end_dt = event.get('end', {}).get('dateTime', '')
        
        start_time = '10:00'  # default
        end_time = '11:30'    # default
        
        if start_dt:
            try:
                from datetime import datetime
                dt = datetime.fromisoformat(start_dt.replace('Z', '+00:00'))
                start_time = dt.strftime('%H:%M')
            except:
                pass
        
        if end_dt:
            try:
                from datetime import datetime
                dt = datetime.fromisoformat(end_dt.replace('Z', '+00:00'))
                end_time = dt.strftime('%H:%M')
            except:
                pass
        
        # Clean title (remove emoji)
        title = re.sub(r'^[^\w\s]+\s*', '', summary)
        
        recurring_events_transformed.append({
            'id': f'recurring_{i}',
            'type': event_type,
            'title': title,
            'day_of_week': day_of_week,
            'start_time': start_time,
            'end_time': end_time,
            'location': event.get('location', ''),
        })
    
    return {
        'course_name': extracted_data.get('course_name', 'Unknown Course'),
        'assessments': assessments,
        'recurring_events': recurring_events_transformed,
    }

async def create_calendar_events(
    google_credentials: Credentials,
    syllabus_data: Dict[str, Any],
    user_email: str
) -> Dict[str, Any]:
    """
    Create a new Google Calendar and add events from syllabus data
    
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
    
    try:
        # Step 1: Create a new calendar for this course
        calendar_body = {
            'summary': course_name,
            'description': f'Automatically generated calendar for {course_name} course events',
            'timeZone': 'America/Toronto'
        }
        
        print(f"📅 Creating new calendar: {course_name}")
        created_calendar = service.calendars().insert(body=calendar_body).execute()
        calendar_id = created_calendar['id']
        calendar_link = f"https://calendar.google.com/calendar/embed?src={calendar_id}"
        
        print(f"✅ Created calendar: {course_name} (ID: {calendar_id})")
        
        # Step 2: Add events to the new calendar
        created_events = []
        failed_events = []
        
        print(f"📝 Adding {len(events)} events to calendar...")
        
        for i, event_data in enumerate(events, 1):
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
                
                print(f"  ✅ Event {i}/{len(events)}: {event_data.get('summary', 'Unknown')}")
                
            except Exception as e:
                failed_events.append({
                    'summary': event_data.get('summary', 'Unknown Event'),
                    'error': str(e)
                })
                print(f"  ❌ Failed event {i}/{len(events)}: {e}")
        
        return {
            'calendar_id': calendar_id,
            'calendar_name': course_name,
            'calendar_link': calendar_link,
            'calendar_embed_link': calendar_link,
            'created_events': created_events,
            'failed_events': failed_events,
            'total_events': len(created_events),
            'total_failures': len(failed_events)
        }
        
    except Exception as e:
        # If calendar creation fails, fallback to primary calendar
        print(f"❌ Failed to create new calendar, falling back to primary: {e}")
        
        calendar_id = 'primary'
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
            'total_failures': len(failed_events),
            'fallback': True,
            'fallback_reason': str(e)
        }


@router.get("/debug-google-scopes")
async def debug_google_scopes(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    x_google_access_token: Optional[str] = Header(None),
) -> JSONResponse:
    """
    Debug endpoint to check what Google scopes the current token has
    """
    if not x_google_access_token:
        return JSONResponse(content={"error": "No Google access token provided"})
    
    try:
        import requests
        
        # Check token info from Google
        response = requests.get(
            f"https://www.googleapis.com/oauth2/v1/tokeninfo?access_token={x_google_access_token}"
        )
        
        if response.status_code == 200:
            token_info = response.json()
            return JSONResponse(content={
                "scopes": token_info.get("scope", "").split(" "),
                "audience": token_info.get("audience"),
                "expires_in": token_info.get("expires_in"),
                "has_calendar": "calendar" in token_info.get("scope", ""),
                "has_gmail": "gmail" in token_info.get("scope", "")
            })
        else:
            return JSONResponse(content={"error": "Failed to validate token", "status": response.status_code})
            
    except Exception as e:
        return JSONResponse(content={"error": str(e)})


@router.post("/{file_id}/setup-email-notifications")
async def setup_email_notifications(
    file_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> JSONResponse:
    """
    Set up email notifications for syllabus assessments
    Uses user's email from JWT token - no additional setup needed!
    """
    # Verify JWT
    jwt_payload = supabase_service.verify_jwt(credentials.credentials)
    if not jwt_payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user_id = jwt_payload.get('sub')
    user_email = jwt_payload.get('email')
    user_name = jwt_payload.get('user_metadata', {}).get('full_name', 'Student')
    
    if not user_email:
        raise HTTPException(status_code=400, detail="No email found in user profile")
    
    try:
        result = await email_notification_service.setup_email_notifications(
            file_id=file_id,
            user_id=user_id,
            user_email=user_email,
            user_name=user_name
        )
        
        return JSONResponse(status_code=200, content=result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.post("/test-email")
async def send_test_email(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> JSONResponse:
    """Send a test email to verify setup"""
    jwt_payload = supabase_service.verify_jwt(credentials.credentials)
    if not jwt_payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user_email = jwt_payload.get('email')
    user_name = jwt_payload.get('user_metadata', {}).get('full_name', 'Student')
    
    if not user_email:
        raise HTTPException(status_code=400, detail="No email found in user profile")
    
    try:
        result = await email_notification_service.send_immediate_test_email(
            user_email=user_email,
            user_name=user_name
        )
        
        return JSONResponse(status_code=200, content=result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.get("/{file_id}/email-notifications")
async def get_email_notifications(
    file_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> JSONResponse:
    """
    Get all email notification schedules for a syllabus
    
    Args:
        file_id: The syllabus file ID
        credentials: Supabase JWT token
        
    Returns:
        List of notification schedules
    """
    # Verify JWT
    jwt_payload = supabase_service.verify_jwt(credentials.credentials)
    if not jwt_payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user_id = jwt_payload.get('sub')
    
    try:
        notifications = await email_notification_service.get_user_notifications(user_id, file_id)
        
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "notifications": notifications,
                "count": len(notifications),
                "file_id": file_id
            }
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching notifications: {str(e)}"
        )


@router.post("/send-due-notifications")
async def send_due_notifications(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    x_system_key: Optional[str] = Header(None),
) -> JSONResponse:
    """
    Manually trigger sending of due email notifications
    This endpoint can be called by a cron job or manually for testing
    
    Authentication options:
    1. JWT token in Authorization header (for user requests)
    2. System key in X-System-Key header (for automated cron jobs)
    """
    
    # Allow system key authentication for cron jobs
    if x_system_key:
        if x_system_key != settings.system_notification_key:
            raise HTTPException(status_code=401, detail="Invalid system key")
    else:
        # Require JWT token for user requests
        jwt_payload = supabase_service.verify_jwt(credentials.credentials)
        if not jwt_payload:
            raise HTTPException(status_code=401, detail="Invalid token")
    
    try:
        result = await email_notification_service.send_due_email_notifications()
        return JSONResponse(status_code=200, content=result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.get("/debug-email")
async def debug_email_config() -> JSONResponse:
    """Debug email configuration"""
    from services.email_service import email_service
    
    debug_info = {
        "smtp_configured": bool(settings.smtp_username and settings.smtp_password),
        "smtp_username": settings.smtp_username or "NOT SET",
        "smtp_server": settings.smtp_server,
        "smtp_port": settings.smtp_port,
        "fastmail_available": hasattr(email_service, 'fastmail') and email_service.fastmail is not None,
    }
    
    return JSONResponse(content=debug_info)


@router.get("/health")
async def health_check() -> Dict[str, str]:
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "syllabus-extraction",
        "model": settings.gemini_model_id
    }
