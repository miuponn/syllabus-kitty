"""
Email notification service using Gmail API with user's authenticated Google account
"""

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from typing import Dict, Any
from config import settings
import logging
import base64
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending email notifications using Gmail API"""
    
    def __init__(self):
        logger.info("Gmail API Email Service initialized")
    
    async def send_event_reminder_email_with_gmail(
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
        
        Args:
            google_credentials: User's Google OAuth credentials
            to_email: Recipient email address (user's own email)
            user_name: User's name for personalization
            event_title: Name of the event/assessment
            course_name: Course name
            event_date: Event date (human readable)
            event_type: Type of event (assignment, exam, etc.)
            days_until: Days until the event
            additional_info: Optional extra details
            
        Returns:
            Email send results
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


# Global service instance
email_service = EmailService()