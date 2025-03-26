from django.core.mail import send_mass_mail, EmailMessage, EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from typing import List, Dict, Union
import threading
from app.models import User

class EmailThread(threading.Thread):
    """Handle emails in separate threads to prevent blocking"""
    
    def __init__(self, email_message):
        self.email_message = email_message
        threading.Thread.__init__(self)

    def run(self):
        self.email_message.send()

class EmailService:
    """Service for handling all email operations"""
    
    @staticmethod
    def send_mass_html_mail(subject: str, 
                           template_name: str, 
                           recipient_list: List[Dict], 
                           context: Dict = None,
                           from_email: str = None) -> bool:
        """
        Send HTML emails to multiple recipients with personalized context
        
        Args:
            subject: Email subject
            template_name: Name of the HTML template to use
            recipient_list: List of dictionaries containing email and context
            context: Global context for all emails
            from_email: Sender email address
        """
        try:
            if from_email is None:
                from_email = settings.DEFAULT_FROM_EMAIL
                
            messages = []
            for recipient in recipient_list:
                # Merge global and recipient-specific context
                email_context = context.copy() if context else {}
                email_context.update(recipient.get('context', {}))
                
                # Render HTML content
                html_content = render_to_string(template_name, email_context)
                text_content = strip_tags(html_content)
                
                # Create message
                msg = EmailMultiAlternatives(
                    subject,
                    text_content,
                    from_email,
                    [recipient['email']]
                )
                msg.attach_alternative(html_content, "text/html")
                messages.append(msg)
            
            # Send emails in separate threads
            for message in messages:
                EmailThread(message).start()
                
            return True
            
        except Exception as e:
            print(f"Error sending mass email: {str(e)}")
            return False
    
    @staticmethod
    def send_event_notification(event, recipients: List[Dict], notification_type: str) -> bool:
        """
        Send event-related notifications
        
        Args:
            event: EventInfo instance
            recipients: List of dictionaries containing email and user info
            notification_type: Type of notification (e.g., 'enrollment', 'reminder')
        """
        try:
            template_map = {
                'enrollment': 'emails/event_enrollment.html',
                'reminder': 'emails/event_reminder.html',
                'cancellation': 'emails/event_cancelled.html',
                'completion': 'emails/event_completed.html',
                'task_assignment': 'emails/task_assigned.html'
            }
            
            subject_map = {
                'enrollment': f'Welcome to {event.event_name}',
                'reminder': f'Reminder: {event.event_name} is starting soon',
                'cancellation': f'Event Cancelled: {event.event_name}',
                'completion': f'Thank you for participating in {event.event_name}',
                'task_assignment': f'New Task Assignment in {event.event_name}'
            }
            
            template_name = template_map.get(notification_type)
            subject = subject_map.get(notification_type)
            
            if not template_name or not subject:
                raise ValueError(f"Invalid notification type: {notification_type}")
            
            # Global context for all emails
            context = {
                'event_name': event.event_name,
                'event_date': event.start_time.strftime('%B %d, %Y'),
                'event_time': event.start_time.strftime('%I:%M %p'),
                'event_location': event.location,
                'host_name': event.host.name,
                'event_overview': event.overview
            }
            
            return EmailService.send_mass_html_mail(
                subject=subject,
                template_name=template_name,
                recipient_list=recipients,
                context=context
            )
            
        except Exception as e:
            print(f"Error sending event notification: {str(e)}")
            return False
        
    # Add to existing EmailService class
    @staticmethod
    def notify_new_event(event):
        """
        Send notification to all users about a new event
        """
        try:
            # Get all non-host users
            recipients = User.objects.filter(isHost=False, is_active=True)
            
            recipient_list = [
                {
                    'email': user.email,
                    'context': {
                        'user': {
                            'name': user.name,
                            'id': user.id
                        }
                    }
                }
                for user in recipients
            ]
            
            # Get the base URL from settings
            base_url = settings.FRONTEND_URL  # Add this to your settings.py
            
            # Global context for all emails
            context = {
                'event': event,
                'base_url': base_url,
            }
            
            return EmailService.send_mass_html_mail(
                subject=f"New Event: {event.event_name}",
                template_name='email/new_event_notification.html',
                recipient_list=recipient_list,
                context=context
            )
            
        except Exception as e:
            print(f"Error sending new event notification: {str(e)}")
            return False