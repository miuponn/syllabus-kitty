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

COLORS = {
    'pink_body': '#C76585',
    'blue_body': '#6c82ff',
    'dark': '#3647A9',
    'blue_lines': '#4558C5',
    'medium_rose': '#D68397',
    'item': '#FFC1D0',
    'bubbles': '#8deef5',
    'hotpink': '#FC76FF',
    'lime': '#B3E97F',
    'blueberry': '#BDDBFF',
    'lemon': '#F7E799',
    'plum': '#CFC4EC',
    'purple_body': '#8E8AE2',
    'persimmon': '#738AFF',
    'orange': '#FEC192',
    'glow_pink': '#FFB2E1',
}


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
            
            # Determine urgency colors based on days until
            if days_until == 0:
                urgency = "TODAY!"
                urgency_color = COLORS['pink_body']
                accent_color = COLORS['item']
                bg_gradient = f"linear-gradient(135deg, {COLORS['item']} 0%, {COLORS['orange']} 100%)"
            elif days_until == 1:
                urgency = "tomorrow!"
                urgency_color = COLORS['medium_rose']
                accent_color = COLORS['item']
                bg_gradient = f"linear-gradient(135deg, {COLORS['item']} 0%, {COLORS['lemon']} 100%)"
            elif days_until <= 3:
                urgency = f"in {days_until} days!"
                urgency_color = COLORS['purple_body']
                accent_color = COLORS['plum']
                bg_gradient = f"linear-gradient(135deg, {COLORS['plum']} 0%, {COLORS['blueberry']} 100%)"
            elif days_until <= 7:
                urgency = f"in {days_until} days"
                urgency_color = COLORS['blue_body']
                accent_color = COLORS['blueberry']
                bg_gradient = f"linear-gradient(135deg, {COLORS['blueberry']} 0%, {COLORS['bubbles']} 100%)"
            else:
                urgency = f"in {days_until} days"
                urgency_color = COLORS['dark']
                accent_color = COLORS['bubbles']
                bg_gradient = f"linear-gradient(135deg, {COLORS['bubbles']} 0%, {COLORS['lime']} 100%)"
            
            subject = f"Syllabus Kitty - {course_name}: {event_title} {urgency}"
            
            # Create HTML email body with brand styling
            html_body = f"""
            <html>
                <head>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap');
                    </style>
                </head>
                <body style="font-family: 'Nunito', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #faf5ff;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                        
                        <!-- Header with gradient -->
                        <div style="background: linear-gradient(135deg, {COLORS['hotpink']} 0%, {COLORS['medium_rose']} 100%); border-radius: 20px 20px 0 0; padding: 30px 20px; text-align: center;">
                            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                Syllabus Kitty
                            </h1>
                            <p style="color: white; margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">
                                Your friendly course reminder
                            </p>
                        </div>
                        
                        <!-- Main content card -->
                        <div style="background: white; padding: 30px; border-radius: 0 0 20px 20px; box-shadow: 0 4px 20px rgba(252, 118, 255, 0.15);">
                            
                            <p style="font-size: 16px; color: {COLORS['dark']};">Hi {user_name},</p>
                            
                            <!-- Event card -->
                            <div style="background: {bg_gradient}; padding: 25px; border-radius: 16px; margin: 20px 0; border: 2px solid {accent_color};">
                                <h2 style="margin: 0 0 15px 0; color: {COLORS['dark']}; font-size: 22px; font-weight: 700;">
                                    {event_title}
                                </h2>
                                
                                <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                                    <div style="background: white; padding: 10px 15px; border-radius: 10px; flex: 1; min-width: 150px;">
                                        <p style="margin: 0; font-size: 12px; color: {COLORS['blue_body']}; font-weight: 600;">COURSE</p>
                                        <p style="margin: 5px 0 0 0; font-size: 14px; color: {COLORS['dark']}; font-weight: 600;">{course_name}</p>
                                    </div>
                                    <div style="background: white; padding: 10px 15px; border-radius: 10px; flex: 1; min-width: 150px;">
                                        <p style="margin: 0; font-size: 12px; color: {COLORS['blue_body']}; font-weight: 600;">DUE DATE</p>
                                        <p style="margin: 5px 0 0 0; font-size: 14px; color: {COLORS['dark']}; font-weight: 600;">{event_date}</p>
                                    </div>
                                    <div style="background: white; padding: 10px 15px; border-radius: 10px; flex: 1; min-width: 150px;">
                                        <p style="margin: 0; font-size: 12px; color: {COLORS['blue_body']}; font-weight: 600;">TYPE</p>
                                        <p style="margin: 5px 0 0 0; font-size: 14px; color: {COLORS['dark']}; font-weight: 600;">{event_type.title()}</p>
                                    </div>
                                </div>
                                
                                <!-- Urgency badge -->
                                <div style="margin-top: 20px; text-align: center;">
                                    <span style="background: {urgency_color}; color: white; padding: 10px 25px; border-radius: 25px; font-size: 16px; font-weight: 700; display: inline-block; box-shadow: 0 3px 10px rgba(0,0,0,0.1);">
                                        Coming up {urgency}
                                    </span>
                                </div>
                            </div>
                            
                            {f'<div style="margin: 20px 0; padding: 20px; background: linear-gradient(135deg, {COLORS["lemon"]} 0%, {COLORS["lime"]} 100%); border-radius: 12px; border-left: 4px solid {COLORS["blue_body"]};"><p style="margin: 0; font-size: 12px; color: {COLORS["blue_body"]}; font-weight: 600;">ADDITIONAL INFO</p><p style="margin: 10px 0 0 0; color: {COLORS["dark"]};">{additional_info}</p></div>' if additional_info else ''}
                            
                            <!-- Encouragement section -->
                            <div style="margin: 25px 0; padding: 20px; background: linear-gradient(135deg, {COLORS['plum']} 0%, {COLORS['blueberry']} 100%); border-radius: 12px; text-align: center;">
                                <p style="margin: 0; font-size: 16px; color: {COLORS['dark']}; font-weight: 600;">
                                    Good luck with your {event_type}! You've got this!
                                </p>
                            </div>
                            
                            <p style="font-size: 13px; color: {COLORS['blue_body']}; text-align: center; margin-top: 25px;">
                                This is an automated reminder from Syllabus Kitty.
                            </p>
                        </div>
                        
                        <!-- Footer -->
                        <div style="text-align: center; padding: 20px; margin-top: 10px;">
                            <p style="font-size: 12px; color: {COLORS['purple_body']}; margin: 0;">
                                Syllabus Kitty - Never miss an assignment again!
                            </p>
                        </div>
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
Syllabus Kitty - Course Reminder

Hi {user_name},

{event_title} is {urgency}

COURSE: {course_name}
DUE: {event_date}
TYPE: {event_type.title()}

{additional_info}

Good luck with your {event_type}! You've got this!

---
Syllabus Kitty - Never miss an assignment again!
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