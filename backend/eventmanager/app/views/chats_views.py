from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from ..models import EventInfo, EventChat, User
from ..serializers.eventchat import EventChatSerializer
import json
import traceback
from django.utils import timezone
from django.db.models import Q

@method_decorator(csrf_exempt, name='dispatch')
class EventChatView(View):
    """
    View for getting and sending chat messages for an event's community chat
    """
    def get(self, request):
        try:
            # Check authentication
            if not request.user.is_authenticated:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Authentication required'
                }, status=401)
                
            # Get event_id from query parameters
            event_id = request.GET.get('event_id')
            
            if not event_id:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Event ID is required'
                }, status=400)
            
            # Get the event
            try:
                event = EventInfo.objects.get(id=event_id)
            except EventInfo.DoesNotExist:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Event not found'
                }, status=404)
            
            # Check access rights - users must be event participants (volunteers or hosts)
            if not (request.user.isHost or 
                   request.user == event.host or 
                   request.user in event.volunteer_enrolled.all()):
                return JsonResponse({
                    'status': 'error',
                    'message': 'You must be enrolled or hosting this event to access the chat'
                }, status=403)
            
            # Get limit and offset for pagination
            limit = int(request.GET.get('limit', 50))
            offset = int(request.GET.get('offset', 0))
            
            # Get chat messages for this event
            messages = event.chat_messages.all().order_by('-timestamp')[offset:offset+limit]
            
            # Serialize the messages with request context for is_current_user flag
            serializer = EventChatSerializer(messages, many=True, context={'request': request})
            
            return JsonResponse({
                'status': 'success',
                'event_id': event_id,
                'event_name': event.event_name,
                'count': len(serializer.data),
                'has_more': event.chat_messages.count() > (offset + limit),
                'messages': serializer.data
            })
            
        except Exception as e:
            print(f"Error in EventChatView GET: {str(e)}")
            print(traceback.format_exc())
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            }, status=500)
    
    def post(self, request):
        try:
            # Check authentication
            if not request.user.is_authenticated:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Authentication required'
                }, status=401)
                
            # Parse request data
            data = request.POST if request.POST else json.loads(request.body)
            
            # Get event_id and message from request data
            event_id = data.get('event_id')
            message_text = data.get('message')
            
            if not event_id:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Event ID is required'
                }, status=400)
                
            if not message_text or message_text.strip() == '':
                return JsonResponse({
                    'status': 'error',
                    'message': 'Message cannot be empty'
                }, status=400)
                
            # Get the event
            try:
                event = EventInfo.objects.get(id=event_id)
            except EventInfo.DoesNotExist:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Event not found'
                }, status=404)
            
            # Check access rights - users must be event participants (volunteers or hosts)
            if not (request.user.isHost or 
                   request.user == event.host or 
                   request.user in event.volunteer_enrolled.all()):
                return JsonResponse({
                    'status': 'error',
                    'message': 'You must be enrolled or hosting this event to send messages'
                }, status=403)
                
            # Create the message
            chat_message = EventChat(
                event=event,
                user=request.user,
                message=message_text
            )
            chat_message.save()
            
            # Serialize the message with request context for is_current_user flag
            serializer = EventChatSerializer(chat_message, context={'request': request})
            
            return JsonResponse({
                'status': 'success',
                'message': 'Message sent successfully',
                'chat_message': serializer.data
            })
            
        except Exception as e:
            print(f"Error in EventChatView POST: {str(e)}")
            print(traceback.format_exc())
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            }, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class EventChatHistoryView(View):
    """
    View for getting all chat history for an event with more advanced filters
    """
    def get(self, request):
        try:
            # Check authentication
            if not request.user.is_authenticated:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Authentication required'
                }, status=401)
                
            # Get event_id from query parameters
            event_id = request.GET.get('event_id')
            
            if not event_id:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Event ID is required'
                }, status=400)
            
            # Get the event
            try:
                event = EventInfo.objects.get(id=event_id)
            except EventInfo.DoesNotExist:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Event not found'
                }, status=404)
            
            # Check access rights
            if not (request.user.isHost or 
                   request.user == event.host or 
                   request.user in event.volunteer_enrolled.all()):
                return JsonResponse({
                    'status': 'error',
                    'message': 'You must be enrolled or hosting this event to access the chat'
                }, status=403)
            
            # Get filter parameters
            from_date = request.GET.get('from_date')
            to_date = request.GET.get('to_date')
            user_id = request.GET.get('user_id')
            host_only = request.GET.get('host_only') == 'true'
            search_text = request.GET.get('search')
            
            # Start with all messages for this event
            messages = event.chat_messages.all()
            
            # Apply filters
            if from_date:
                messages = messages.filter(timestamp__gte=from_date)
                
            if to_date:
                messages = messages.filter(timestamp__lte=to_date)
                
            if user_id:
                messages = messages.filter(user_id=user_id)
                
            if host_only:
                messages = messages.filter(is_host=True)
                
            if search_text:
                messages = messages.filter(message__icontains=search_text)
            
            # Order by timestamp (newest first)
            messages = messages.order_by('-timestamp')
            
            # Get limit and offset for pagination
            limit = int(request.GET.get('limit', 100))
            offset = int(request.GET.get('offset', 0))
            
            # Apply pagination
            paginated_messages = messages[offset:offset+limit]
            
            # Serialize the messages with request context for is_current_user flag
            serializer = EventChatSerializer(paginated_messages, many=True, context={'request': request})
            
            return JsonResponse({
                'status': 'success',
                'event_id': event_id,
                'event_name': event.event_name,
                'total_count': messages.count(),
                'returned_count': len(serializer.data),
                'has_more': messages.count() > (offset + limit),
                'messages': serializer.data
            })
            
        except Exception as e:
            print(f"Error in EventChatHistoryView: {str(e)}")
            print(traceback.format_exc())
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            }, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class RecentEventChatsView(View):
    """
    View for getting recent chats across all events the user is part of
    """
    def get(self, request):
        try:
            # Check authentication
            if not request.user.is_authenticated:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Authentication required'
                }, status=401)
            
            # Get user's events
            if request.user.isHost:
                # For hosts, get events they are hosting
                user_events = EventInfo.objects.filter(host=request.user)
            else:
                # For volunteers, get events they are enrolled in
                user_events = request.user.enrolled_events.all()
            
            # Get event ids
            event_ids = list(user_events.values_list('id', flat=True))
            
            # Get limit for number of messages per event
            limit = int(request.GET.get('limit', 5))
            
            # Get recent messages for these events
            recent_chats_by_event = {}
            
            for event_id in event_ids:
                try:
                    event = EventInfo.objects.get(id=event_id)
                    messages = event.chat_messages.all().order_by('-timestamp')[:limit]
                    
                    if messages.exists():
                        # Include request context for is_current_user flag
                        serializer = EventChatSerializer(messages, many=True, context={'request': request})
                        recent_chats_by_event[event_id] = {
                            'event_id': event_id,
                            'event_name': event.event_name,
                            'message_count': messages.count(),
                            'messages': serializer.data
                        }
                except EventInfo.DoesNotExist:
                    continue
            
            return JsonResponse({
                'status': 'success',
                'event_count': len(recent_chats_by_event),
                'events': list(recent_chats_by_event.values())
            })
            
        except Exception as e:
            print(f"Error in RecentEventChatsView: {str(e)}")
            print(traceback.format_exc())
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            }, status=500)