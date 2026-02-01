"""
Gmail API email notification service for Syllabus Kitty
"""

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from typing import Dict, Any
from config import settings
import logging
import base64
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
import pytz

logger = logging.getLogger(__name__)


class GmailNotificationService:
    """Service for sending email notifications using user's Gmail account via Gmail API"""
    
    def __init__(self):
        logger.info("Gmail API Notification Service initialized")
    
    async def setup_notifications_from_calendar_events(
        self,
        google_credentials: Credentials,
        user_email: str,
        user_name: str,
        events: list
    ) -> Dict[str, Any]:
        """
        Set up notifications from Google Calendar events after calendar creation
        
        Args:
            google_credentials: User's Google OAuth credentials
            user_email: User's email address
            user_name: User's name
            events: List of created calendar events from create_calendar_events response
            
        Returns:
            Results of notification setup
        """
        try:
            logger.info(f"Setting up Gmail notifications for {len(events)} created events for {user_email}")
            
            immediate_sent = 0
            current_time = datetime.now(pytz.timezone('America/New_York'))
            
            for event in events:
                try:
                    # Extract event start time from created event format
                    if 'start' not in event:
                        logger.warning(f"Event {event.get('summary', 'Unknown')} missing start time")
                        continue
                        
                    event_start = event['start']
                    
                    # Parse event date 
                    if 'dateTime' in event_start:
                        event_datetime = datetime.fromisoformat(
                            event_start['dateTime'].replace('Z', '+00:00')
                        ).replace(tzinfo=pytz.UTC)
                    else:
                        # All-day event
                        event_date = datetime.strptime(event_start['date'], '%Y-%m-%d')
                        event_datetime = pytz.timezone('America/New_York').localize(event_date)
                    
                    # Convert to EST
                    event_datetime_est = event_datetime.astimezone(pytz.timezone('America/New_York'))
                    
                    # Calculate days until event
                    days_until = (event_datetime_est.date() - current_time.date()).days
                    
                    # Check if it's an assessment
                    event_title = event.get('summary', '')
                    is_assessment = any(keyword in event_title.lower() for keyword in [
                        'assignment', 'exam', 'quiz', 'test', 'midterm', 'final',
                        'project', 'homework', 'hw', 'lab', 'presentation', 'due'
                    ])
                    
                    # If assessment is due within 10 days, send immediate notification
                    if is_assessment and 0 <= days_until <= 10:
                        logger.info(f"🚨 Assessment due within 10 days: {event_title} (due in {days_until} days)")
                        
                        result = await self.send_gmail_notification(
                            google_credentials=google_credentials,
                            to_email=user_email,
                            user_name=user_name,
                            event_title=event_title,
                            course_name='Course',  # We don't have course info in created events
                            event_date=event_datetime_est.strftime('%B %d, %Y at %I:%M %p'),
                            event_type=self._determine_event_type(event_title),
                            days_until=days_until,
                            additional_info=''
                        )
                        
                        if result['success']:
                            immediate_sent += 1
                            logger.info(f"✅ Notification sent for: {event_title}")
                        else:
                            logger.error(f"❌ Failed to send notification: {result.get('error')}")
                
                except Exception as e:
                    logger.error(f"Error processing event {event.get('summary', 'Unknown')}: {e}")
                    continue
            
            message = f"Sent {immediate_sent} urgent notifications via Gmail" if immediate_sent > 0 else "No urgent assessments found (due within 10 days)"
            
            logger.info(f"✅ Notification setup complete: {message}")
            return {
                "success": True,
                "immediate_notifications_sent": immediate_sent,
                "message": message
            }
            
        except Exception as e:
            error_msg = f"Failed to set up Gmail notifications: {e}"
            logger.error(error_msg)
            return {
                "success": False,
                "error": error_msg,
                "immediate_notifications_sent": 0
            }
    
    async def send_gmail_notification(
        self,
        google_credentials: Credentials,
        to_email: str,
        user_name: str,
        event_title: str,
        course_name: str,
        event_date: str,
        event_type: str = "event",
        days_until: int = 10,
        additional_info: str = ""
    ) -> Dict[str, Any]:
        """
        Send a formatted event reminder email using user's Gmail account
        """
        try:
            # Build Gmail service with user's credentials
            service = build('gmail', 'v1', credentials=google_credentials)
            
            # Create email content
            emoji_map = {
                'assignment': '📝',
                'exam': '📝',
                'quiz': '❓',
                'project': '🚀',
                'midterm': '📝',
                'final': '📝',
                'lab': '🧪',
                'presentation': '🎤'
            }
            
            emoji = emoji_map.get(event_type.lower(), '📅')
            
            if days_until == 0:
                urgency = "TODAY!"
                urgency_color = "#ff0000"
            elif days_until == 1:
                urgency = "tomorrow!"
                urgency_color = "#ff4444"
            elif days_until <= 3:
                urgency = f"in {days_until} days!"
                urgency_color = "#ff8800"
            elif days_until <= 7:
                urgency = f"in {days_until} days"
                urgency_color = "#ffaa00"
            else:
                urgency = f"in {days_until} days"
                urgency_color = "#0066cc"
            
            subject = f"{emoji} {course_name} - {event_title} {urgency}"
            
            # Create HTML email body
            html_body = f"""
            <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: {urgency_color};">{emoji} Course Reminder</h2>
                        
                        <p>Hi {user_name},</p>
                        
                        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid {urgency_color};">
                            <h3 style="margin: 0 0 10px 0; color: {urgency_color};">
                                {event_title}
                            </h3>
                            <p style="margin: 5px 0;"><strong>Course:</strong> {course_name}</p>
                            <p style="margin: 5px 0;"><strong>Due:</strong> {event_date}</p>
                            <p style="margin: 5px 0;"><strong>Type:</strong> {event_type.title()}</p>
                            <p style="margin: 15px 0 5px 0; font-size: 18px; color: {urgency_color};">
                                <strong>Coming up {urgency}</strong>
                            </p>
                        </div>
                        
                        {f'<div style="margin: 15px 0; padding: 15px; background-color: #e8f4f8; border-radius: 5px;"><strong>Additional Info:</strong><br>{additional_info}</div>' if additional_info else ''}
                        
                        <div style="margin: 30px 0;">
                            <p>🍀 Good luck with your {event_type}!</p>
                            <p style="font-size: 14px; color: #666;">
                                This is an automated reminder from Syllabus Kitty.
                            </p>
                        </div>
                        
                        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                        <p style="font-size: 12px; color: #888; text-align: center;">
                            🐱 Syllabus Kitty - Never miss an assignment again!
                        </p>
                    </div>
                </body>
            </html>
            """
            
            # Create the email message
            message = MIMEMultipart('alternative')
            message['to'] = to_email
            message['from'] = to_email  # Send from user's own Gmail
            message['subject'] = subject
            
            # Create plain text version
            text_body = f"""
{emoji} {course_name} Reminder

Hi {user_name},

{event_title} is {urgency}
📅 {event_date}
📚 {course_name}
Type: {event_type.title()}

{additional_info}

Good luck with your {event_type}! 🍀

---
🐱 Syllabus Kitty - Never miss an assignment again!
            """.strip()
            
            # Attach parts
            part1 = MIMEText(text_body, 'plain')
            part2 = MIMEText(html_body, 'html')
            message.attach(part1)
            message.attach(part2)
            
            # Encode the message
            raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
            
            # Send the email
            send_result = service.users().messages().send(
                userId='me',
                body={'raw': raw_message}
            ).execute()
            
            logger.info(f"Gmail API email sent successfully to {to_email} (Message ID: {send_result['id']})")
            return {
                "success": True,
                "to": to_email,
                "subject": subject,
                "message_id": send_result['id'],
                "error": None
            }
            
        except Exception as e:
            logger.error(f"Failed to send Gmail API email to {to_email}: {e}")
            return {
                "success": False,
                "error": str(e),
                "to": to_email
            }
    
    def _determine_event_type(self, event_title: str) -> str:
        """Determine the type of event based on title"""
        title_lower = event_title.lower()
        
        if any(word in title_lower for word in ['exam', 'midterm', 'final']):
            return 'exam'
        elif any(word in title_lower for word in ['quiz', 'test']):
            return 'quiz'
        elif any(word in title_lower for word in ['assignment', 'homework', 'hw']):
            return 'assignment'
        elif any(word in title_lower for word in ['project']):
            return 'project'
        elif any(word in title_lower for word in ['lab']):
            return 'lab'
        elif any(word in title_lower for word in ['presentation']):
            return 'presentation'
        else:
            return 'event'


# Global service instance
gmail_notification_service = GmailNotificationService()