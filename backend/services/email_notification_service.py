"""
Simple email notification service - no Celery needed for basic functionality
"""

from datetime import datetime, timedelta
import pytz
from typing import List, Dict, Any, Optional
from services.supabase_service import supabase_service
from services.email_service import email_service
from config import settings
import logging
import re

logger = logging.getLogger(__name__)


class EmailNotificationService:
    """Simple email notification service"""
    
    def __init__(self):
        self.timezone = pytz.timezone(settings.timezone)
    
    async def setup_email_notifications(
        self,
        file_id: str,
        user_id: str,
        user_email: str,
        user_name: str = "Student"
    ) -> Dict[str, Any]:
        """
        Set up email notifications for all assessments in a syllabus
        No database needed - just send emails at the right time
        """
        try:
            # Check if email service is configured
            from services.email_service import email_service
            
            if not email_service.fastmail:
                return {
                    "success": False,
                    "message": "Email service not configured - check SMTP settings in .env file",
                    "scheduled_count": 0,
                    "config_issue": True
                }
            
            print(f"📧 Email service is configured, proceeding with setup...")
            
            # Get calendar items from database
            response = supabase_service.supabase.table('calendar_items').select(
                '*'
            ).eq('syllabus_id', file_id).eq('user_id', user_id).execute()
            
            calendar_items = response.data if response.data else []
            assessment_items = [item for item in calendar_items if item['type'] == 'assessment']
            
            if not assessment_items:
                return {
                    "success": False,
                    "message": "No assessments found to notify about",
                    "scheduled_count": 0
                }
            
            # Schedule emails for each assessment
            scheduled_count = 0
            notifications = []
            
            for item in assessment_items:
                event_json = item.get('event_json', {})
                event_start = event_json.get('start', {}).get('dateTime')
                
                if event_start:
                    event_dt = datetime.fromisoformat(event_start.replace('Z', '+00:00'))
                    notification_dt = event_dt - timedelta(days=settings.notification_advance_days)
                    
                    # Only schedule future notifications
                    if notification_dt > datetime.now(pytz.UTC):
                        # Clean the event title for display
                        event_title = event_json.get('summary', 'Unknown Event')
                        clean_title = re.sub(r'^[^\w\s]+\s*', '', event_title)  # Remove emoji
                        clean_title = re.sub(r'\s*\(\d+%\).*$', '', clean_title)  # Remove weight
                        
                        # Format date for display
                        local_dt = event_dt.astimezone(self.timezone)
                        formatted_date = local_dt.strftime('%B %d, %Y at %I:%M %p')
                        
                        # Determine event type
                        event_type = 'assignment'
                        title_lower = event_title.lower()
                        if 'exam' in title_lower or 'midterm' in title_lower or 'final' in title_lower:
                            event_type = 'exam'
                        elif 'quiz' in title_lower:
                            event_type = 'quiz'
                        elif 'project' in title_lower:
                            event_type = 'project'
                        elif 'presentation' in title_lower:
                            event_type = 'presentation'
                        elif 'lab' in title_lower:
                            event_type = 'lab'
                        
                        # Store notification info
                        notification_info = {
                            'event_title': clean_title,
                            'course_name': item.get('course_name', 'Unknown Course'),
                            'event_date': formatted_date,
                            'event_type': event_type,
                            'notification_date': notification_dt.isoformat(),
                            'days_until': settings.notification_advance_days,
                            'calendar_item_id': item['id']
                        }
                        notifications.append(notification_info)
                        scheduled_count += 1
            
            # Store notifications in database for future sending
            if notifications:
                await self._store_notification_schedules(notifications, user_id, user_email, user_name, file_id)
            
            return {
                "success": True,
                "message": f"Set up {scheduled_count} email notifications",
                "scheduled_count": scheduled_count,
                "notifications": notifications,
                "user_email": user_email
            }
            
        except Exception as e:
            logger.error(f"Error setting up email notifications: {e}")
            return {
                "success": False,
                "message": f"Error: {str(e)}",
                "scheduled_count": 0
            }
    
    async def _store_notification_schedules(
        self,
        notifications: List[Dict[str, Any]],
        user_id: str,
        user_email: str,
        user_name: str,
        file_id: str
    ) -> None:
        """Store notification schedules in database"""
        try:
            schedules_to_insert = []
            
            for notification in notifications:
                schedule_data = {
                    'user_id': user_id,
                    'syllabus_id': file_id,
                    'calendar_item_id': notification['calendar_item_id'],
                    'course_name': notification['course_name'],
                    'event_title': notification['event_title'],
                    'event_type': notification['event_type'],
                    'event_date': notification['event_date'],
                    'notification_date': notification['notification_date'],
                    'notification_type': 'email',
                    'recipient_email': user_email,
                    'recipient_name': user_name,
                    'status': 'scheduled',
                    'days_advance': notification['days_until'],
                    'metadata': {
                        'created_at': datetime.now().isoformat(),
                        'formatted_date': notification['event_date']
                    }
                }
                schedules_to_insert.append(schedule_data)
            
            # Insert notification schedules
            response = supabase_service.supabase.table('email_notification_schedules').insert(
                schedules_to_insert
            ).execute()
            
            if response.data:
                logger.info(f"Stored {len(schedules_to_insert)} notification schedules in database")
            
        except Exception as e:
            logger.error(f"Error storing notification schedules: {e}")
            # Don't fail the main operation if storage fails
    
    async def check_and_send_immediate_notifications(
        self,
        file_id: str,
        user_id: str,
        user_email: str,
        user_name: str = "Student"
    ) -> Dict[str, Any]:
        """
        Check for assessments due within 10 days and send immediate email notifications
        
        Args:
            file_id: Syllabus file ID
            user_id: User ID
            user_email: User's email address
            user_name: User's name for personalization
            
        Returns:
            Results of immediate notification sending
        """
        try:
            # Get calendar items from database
            response = supabase_service.supabase.table('calendar_items').select(
                '*'
            ).eq('syllabus_id', file_id).eq('user_id', user_id).execute()
            
            calendar_items = response.data if response.data else []
            assessment_items = [item for item in calendar_items if item['type'] == 'assessment']
            
            if not assessment_items:
                return {
                    "success": True,
                    "message": "No assessments found",
                    "sent_count": 0,
                    "upcoming_assessments": []
                }
            
            # Check which assessments are due within 10 days
            now = datetime.now(pytz.UTC)
            ten_days_from_now = now + timedelta(days=settings.notification_advance_days)
            
            upcoming_assessments = []
            sent_count = 0
            
            for item in assessment_items:
                event_json = item.get('event_json', {})
                event_start = event_json.get('start', {}).get('dateTime')
                
                if event_start:
                    try:
                        event_dt = datetime.fromisoformat(event_start.replace('Z', '+00:00'))
                        
                        # Check if assessment is due within 10 days
                        if now <= event_dt <= ten_days_from_now:
                            # Clean the event title for display
                            event_title = event_json.get('summary', 'Unknown Event')
                            clean_title = re.sub(r'^[^\w\s]+\s*', '', event_title)  # Remove emoji
                            clean_title = re.sub(r'\s*\(\d+%\).*$', '', clean_title)  # Remove weight
                            
                            # Format date for display
                            local_dt = event_dt.astimezone(self.timezone)
                            formatted_date = local_dt.strftime('%B %d, %Y at %I:%M %p')
                            
                            # Calculate days until due
                            days_until = (event_dt - now).days
                            if days_until < 0:
                                days_until = 0
                            
                            # Determine event type
                            event_type = 'assignment'
                            title_lower = event_title.lower()
                            if 'exam' in title_lower or 'midterm' in title_lower or 'final' in title_lower:
                                event_type = 'exam'
                            elif 'quiz' in title_lower:
                                event_type = 'quiz'
                            elif 'project' in title_lower:
                                event_type = 'project'
                            elif 'presentation' in title_lower:
                                event_type = 'presentation'
                            elif 'lab' in title_lower:
                                event_type = 'lab'
                            
                            # Send immediate email notification
                            email_result = await email_service.send_event_reminder_email(
                                to_email=user_email,
                                user_name=user_name,
                                event_title=clean_title,
                                course_name=item.get('course_name', 'Unknown Course'),
                                event_date=formatted_date,
                                event_type=event_type,
                                days_until=days_until,
                                additional_info=f"This assessment was found when you created your calendar and is due soon!"
                            )
                            
                            if email_result.get('success'):
                                sent_count += 1
                                upcoming_assessments.append({
                                    'title': clean_title,
                                    'course_name': item.get('course_name', 'Unknown Course'),
                                    'due_date': formatted_date,
                                    'days_until': days_until,
                                    'type': event_type,
                                    'email_sent': True
                                })
                                
                                logger.info(f"Sent immediate notification for {clean_title} due in {days_until} days")
                            else:
                                upcoming_assessments.append({
                                    'title': clean_title,
                                    'course_name': item.get('course_name', 'Unknown Course'),
                                    'due_date': formatted_date,
                                    'days_until': days_until,
                                    'type': event_type,
                                    'email_sent': False,
                                    'error': email_result.get('error')
                                })
                    
                    except Exception as e:
                        logger.error(f"Error processing assessment {item.get('id')}: {e}")
                        continue
            
            return {
                "success": True,
                "message": f"Checked {len(assessment_items)} assessments, sent {sent_count} immediate notifications",
                "sent_count": sent_count,
                "total_assessments": len(assessment_items),
                "upcoming_assessments": upcoming_assessments,
                "check_period_days": settings.notification_advance_days
            }
            
        except Exception as e:
            logger.error(f"Error checking immediate notifications for file {file_id}: {e}")
            return {
                "success": False,
                "message": f"Error: {str(e)}",
                "sent_count": 0,
                "upcoming_assessments": []
            }
    
    async def send_due_email_notifications(self) -> Dict[str, Any]:
        """
        Send all email notifications that are due now
        This can be called manually or by a cron job
        
        Returns:
            Results of sending notifications
        """
        try:
            now = datetime.now(pytz.UTC)
            # Find notifications due within the next hour
            hour_from_now = now + timedelta(hours=1)
            
            response = supabase_service.supabase.table('email_notification_schedules').select(
                '*'
            ).eq('status', 'scheduled').lte(
                'notification_date', hour_from_now.isoformat()
            ).gte(
                'notification_date', now.isoformat()
            ).execute()
            
            due_notifications = response.data if response.data else []
            
            sent_count = 0
            failed_count = 0
            
            for notification in due_notifications:
                result = await self._send_single_notification(notification)
                if result.get('success'):
                    sent_count += 1
                    # Mark as sent in database
                    await self._mark_notification_sent(notification['id'])
                else:
                    failed_count += 1
                    # Mark as failed in database
                    await self._mark_notification_failed(notification['id'], result.get('error', 'Unknown error'))
            
            return {
                "success": True,
                "sent_count": sent_count,
                "failed_count": failed_count,
                "total_due": len(due_notifications)
            }
            
        except Exception as e:
            logger.error(f"Error sending due email notifications: {e}")
            return {
                "success": False,
                "message": f"Error: {str(e)}",
                "sent_count": 0,
                "failed_count": 0
            }
    
    async def _send_single_notification(self, notification: Dict[str, Any]) -> Dict[str, Any]:
        """Send a single email notification"""
        try:
            result = await email_service.send_event_reminder_email(
                to_email=notification['recipient_email'],
                user_name=notification.get('recipient_name', 'Student'),
                event_title=notification['event_title'],
                course_name=notification['course_name'],
                event_date=notification['event_date'],
                event_type=notification['event_type'],
                days_until=notification['days_advance']
            )
            return result
            
        except Exception as e:
            logger.error(f"Error sending notification {notification['id']}: {e}")
            return {"success": False, "error": str(e)}
    
    async def _mark_notification_sent(self, notification_id: int) -> None:
        """Mark a notification as successfully sent"""
        try:
            supabase_service.supabase.table('email_notification_schedules').update({
                'status': 'sent',
                'sent_at': datetime.now().isoformat()
            }).eq('id', notification_id).execute()
        except Exception as e:
            logger.error(f"Error marking notification {notification_id} as sent: {e}")
    
    async def _mark_notification_failed(self, notification_id: int, error_message: str) -> None:
        """Mark a notification as failed"""
        try:
            supabase_service.supabase.table('email_notification_schedules').update({
                'status': 'failed',
                'failed_at': datetime.now().isoformat(),
                'error_message': error_message
            }).eq('id', notification_id).execute()
        except Exception as e:
            logger.error(f"Error marking notification {notification_id} as failed: {e}")
    
    async def send_immediate_test_email(
        self,
        user_email: str,
        user_name: str = "Student"
    ) -> Dict[str, Any]:
        """Send a test email immediately"""
        return await email_service.send_event_reminder_email(
            to_email=user_email,
            user_name=user_name,
            event_title="Test Assignment",
            course_name="Test Course (CSI 1234)",
            event_date="February 15, 2026 at 11:59 PM",
            event_type="assignment",
            days_until=10,
            additional_info="This is a test email to verify your notification setup is working correctly."
        )
    
    async def get_user_notifications(self, user_id: str, file_id: str = None) -> List[Dict[str, Any]]:
        """Get notification schedules for a user"""
        try:
            query = supabase_service.supabase.table('email_notification_schedules').select(
                '*'
            ).eq('user_id', user_id)
            
            if file_id:
                query = query.eq('syllabus_id', file_id)
            
            response = query.execute()
            return response.data if response.data else []
            
        except Exception as e:
            logger.error(f"Error fetching notifications for user {user_id}: {e}")
            return []


# Global service instance
email_notification_service = EmailNotificationService()