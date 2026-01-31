"""
Simple script to test Google Calendar event insertion.
Uses Desktop App flow for easy testing.
"""

from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
import os
from datetime import datetime, timedelta

SCOPES = ['https://www.googleapis.com/auth/calendar']
CREDENTIALS_FILE = 'credentials.json'
TOKEN_FILE = 'token.json'


def get_calendar_service():
    """Authenticate and return Google Calendar service"""
    creds = None
    
    # Load existing token
    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
    
    # If no valid creds, authenticate
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not os.path.exists(CREDENTIALS_FILE):
                print(f"❌ {CREDENTIALS_FILE} not found!")
                print("Download it from Google Cloud Console and save it here.")
                return None
            
            flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_FILE, SCOPES)
            creds = flow.run_local_server(port=0)
        
        # Save token
        with open(TOKEN_FILE, 'w') as f:
            f.write(creds.to_json())
    
    return build('calendar', 'v3', credentials=creds)


def create_test_event(service):
    """Create a simple test event"""
    # Event starts tomorrow at 2pm, lasts 1 hour
    start = datetime.now() + timedelta(days=1)
    start = start.replace(hour=14, minute=0, second=0, microsecond=0)
    end = start + timedelta(hours=1)
    
    event = {
        'summary': '🐱 Syllabus Kitty Test Event',
        'description': 'This is a test event created by Syllabus Kitty!',
        'start': {
            'dateTime': start.isoformat(),
            'timeZone': 'America/Toronto',
        },
        'end': {
            'dateTime': end.isoformat(),
            'timeZone': 'America/Toronto',
        },
    }
    
    created = service.events().insert(calendarId='primary', body=event).execute()
    return created


def main():
    print("=" * 50)
    print("Google Calendar Test")
    print("=" * 50)
    
    print("\n🔐 Authenticating...")
    service = get_calendar_service()
    
    if not service:
        return
    
    print("✅ Authenticated!")
    
    print("\n📅 Creating test event...")
    event = create_test_event(service)
    
    print(f"✅ Event created!")
    print(f"   Title: {event['summary']}")
    print(f"   Link: {event.get('htmlLink')}")


if __name__ == "__main__":
    main()
