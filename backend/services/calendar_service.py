"""
Google Calendar API Service
This will be used later to create calendar events from extracted syllabus data
"""

from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from typing import Dict, Any, List, Optional
import os.path
import pickle
from datetime import datetime, timedelta
from config import settings


# If modifying these scopes, delete the token.pickle file
SCOPES = ['https://www.googleapis.com/auth/calendar']


class GoogleCalendarService:
    """Service for interacting with Google Calendar API"""
    
    def __init__(self):
        self.service = None
        
    def authenticate(self) -> None:
        """Authenticate with Google Calendar API using OAuth2"""
        creds = None
        
        # Check if token exists
        if os.path.exists(settings.google_calendar_token_path):
            with open(settings.google_calendar_token_path, 'rb') as token:
                creds = pickle.load(token)
                
        # If no valid credentials, let user log in
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                if not os.path.exists(settings.google_calendar_credentials_path):
                    raise FileNotFoundError(
                        f"Credentials file not found at {settings.google_calendar_credentials_path}. "
                        "Please download it from Google Cloud Console."
                    )
                    
                flow = InstalledAppFlow.from_client_secrets_file(
                    settings.google_calendar_credentials_path, SCOPES
                )
                creds = flow.run_local_server(port=0)
                
            # Save credentials for next run
            with open(settings.google_calendar_token_path, 'wb') as token:
                pickle.dump(creds, token)
                
        self.service = build('calendar', 'v3', credentials=creds)
    
    async def create_course_calendar(
        self,
        course_name: str,
        description: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a new calendar for a course
        
        Args:
            course_name: Name of the course
            description: Optional description
            
        Returns:
            Created calendar object
        """
        if not self.service:
            self.authenticate()
            
        calendar = {
            'summary': course_name,
            'description': description or f'Calendar for {course_name}',
            'timeZone': 'America/Toronto'  # TODO: Make this configurable
        }
        
        created_calendar = self.service.calendars().insert(body=calendar).execute()
        return created_calendar
    
    async def create_recurring_event(
        self,
        calendar_id: str,
        title: str,
        location: str,
        start_datetime: datetime,
        end_datetime: datetime,
        recurrence_rule: str,
        description: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a recurring event (e.g., weekly lecture)
        
        Args:
            calendar_id: ID of the calendar to add event to
            title: Event title
            location: Event location
            start_datetime: First occurrence start time
            end_datetime: First occurrence end time
            recurrence_rule: RRULE string (e.g., "RRULE:FREQ=WEEKLY;BYDAY=MO,WE;COUNT=30")
            description: Optional event description
            
        Returns:
            Created event object
        """
        if not self.service:
            self.authenticate()
            
        event = {
            'summary': title,
            'location': location,
            'description': description or '',
            'start': {
                'dateTime': start_datetime.isoformat(),
                'timeZone': 'America/Toronto',
            },
            'end': {
                'dateTime': end_datetime.isoformat(),
                'timeZone': 'America/Toronto',
            },
            'recurrence': [recurrence_rule],
        }
        
        created_event = self.service.events().insert(
            calendarId=calendar_id,
            body=event
        ).execute()
        
        return created_event
    
    async def create_single_event(
        self,
        calendar_id: str,
        title: str,
        due_date: datetime,
        description: Optional[str] = None,
        all_day: bool = False
    ) -> Dict[str, Any]:
        """
        Create a single event (e.g., assignment due date)
        
        Args:
            calendar_id: ID of the calendar
            title: Event title
            due_date: Due date/time
            description: Optional description
            all_day: Whether this is an all-day event
            
        Returns:
            Created event object
        """
        if not self.service:
            self.authenticate()
            
        event = {
            'summary': title,
            'description': description or '',
        }
        
        if all_day:
            event['start'] = {'date': due_date.date().isoformat()}
            event['end'] = {'date': due_date.date().isoformat()}
        else:
            event['start'] = {
                'dateTime': due_date.isoformat(),
                'timeZone': 'America/Toronto',
            }
            event['end'] = {
                'dateTime': (due_date + timedelta(hours=1)).isoformat(),
                'timeZone': 'America/Toronto',
            }
        
        created_event = self.service.events().insert(
            calendarId=calendar_id,
            body=event
        ).execute()
        
        return created_event
    
    async def create_calendar_from_syllabus(
        self,
        syllabus_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Create a complete calendar from extracted syllabus data
        
        Args:
            syllabus_data: Parsed syllabus document
            
        Returns:
            Dictionary with calendar ID and created events
        """
        # TODO: Implement full syllabus → calendar conversion
        # This will be implemented once the extraction is working
        raise NotImplementedError("Full syllabus calendar creation coming soon!")


# Global service instance
google_calendar_service = GoogleCalendarService()
