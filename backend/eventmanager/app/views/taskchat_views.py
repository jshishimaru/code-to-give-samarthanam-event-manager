from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from ..models import TaskInfo, Chat, User
from ..serializers.chat import TaskChatSerializer
import json
import traceback
from django.utils import timezone
from django.db.models import Q

@method_decorator(csrf_exempt, name='dispatch')
class TaskChatView(View):
    """
    View for getting and sending chat messages for a task
    """
    def get(self, request):
        try:
            # Check authentication
            if not request.user.is_authenticated:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Authentication required'
                }, status=401)
                
            # Get task_id from query parameters
            task_id = request.GET.get('task_id')
            
            if not task_id:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Task ID is required'
                }, status=400)
            
            # Get the task
            try:
                task = TaskInfo.objects.get(id=task_id)
            except TaskInfo.DoesNotExist:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Task not found'
                }, status=404)
            
            # Check access rights - user must be assigned to the task, be the host, or be the event host
            if not (
                request.user in task.volunteers.all() or 
                request.user.isHost or 
                request.user == task.event.host
            ):
                return JsonResponse({
                    'status': 'error',
                    'message': 'You must be assigned to this task or be a host to access the chat'
                }, status=403)
            
            # Get limit and offset for pagination
            limit = int(request.GET.get('limit', 50))
            offset = int(request.GET.get('offset', 0))
            
            # Get chat messages for this task
            messages = task.messages.all().order_by('-timestamp')[offset:offset+limit]
            
            # Serialize the messages
            serializer = TaskChatSerializer(messages, many=True, context={'request': request})
            
            # Get task details for context
            task_data = {
                'task_id': task.id,
                'task_name': task.task_name,
                'event_id': task.event.id,
                'event_name': task.event.event_name,
                'status': task.status
            }
            
            return JsonResponse({
                'status': 'success',
                'task': task_data,
                'count': len(serializer.data),
                'has_more': task.messages.count() > (offset + limit),
                'messages': serializer.data
            })
            
        except Exception as e:
            print(f"Error in TaskChatView GET: {str(e)}")
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
            
            # Get task_id and message from request data
            task_id = data.get('task_id')
            message_text = data.get('message')
            
            if not task_id:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Task ID is required'
                }, status=400)
                
            if not message_text or message_text.strip() == '':
                return JsonResponse({
                    'status': 'error',
                    'message': 'Message cannot be empty'
                }, status=400)
                
            # Get the task
            try:
                task = TaskInfo.objects.get(id=task_id)
            except TaskInfo.DoesNotExist:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Task not found'
                }, status=404)
            
            # Check access rights - user must be assigned to the task, be the host, or be the event host
            if not (
                request.user in task.volunteers.all() or 
                request.user.isHost or 
                request.user == task.event.host
            ):
                return JsonResponse({
                    'status': 'error',
                    'message': 'You must be assigned to this task or be a host to send messages'
                }, status=403)
                
            # Create the message
            chat_message = Chat(
                task=task,
                user=request.user,
                text=message_text
            )
            chat_message.save()
            
            # Serialize the message
            serializer = TaskChatSerializer(chat_message, context={'request': request})
            
            return JsonResponse({
                'status': 'success',
                'message': 'Message sent successfully',
                'chat_message': serializer.data
            })
            
        except Exception as e:
            print(f"Error in TaskChatView POST: {str(e)}")
            print(traceback.format_exc())
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            }, status=500)

@method_decorator(csrf_exempt, name='dispatch')
class TaskChatHistoryView(View):
    """
    View for getting all chat history for a task with advanced filters
    """
    def get(self, request):
        try:
            # Check authentication
            if not request.user.is_authenticated:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Authentication required'
                }, status=401)
                
            # Get task_id from query parameters
            task_id = request.GET.get('task_id')
            
            if not task_id:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Task ID is required'
                }, status=400)
            
            # Get the task
            try:
                task = TaskInfo.objects.get(id=task_id)
            except TaskInfo.DoesNotExist:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Task not found'
                }, status=404)
            
            # Check access rights
            if not (
                request.user in task.volunteers.all() or 
                request.user.isHost or 
                request.user == task.event.host
            ):
                return JsonResponse({
                    'status': 'error',
                    'message': 'You must be assigned to this task or be a host to access the chat history'
                }, status=403)
            
            # Get filter parameters
            from_date = request.GET.get('from_date')
            to_date = request.GET.get('to_date')
            user_id = request.GET.get('user_id')
            host_only = request.GET.get('host_only') == 'true'
            search_text = request.GET.get('search')
            
            # Start with all messages for this task
            messages = task.messages.all()
            
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
                messages = messages.filter(text__icontains=search_text)
            
            # Order by timestamp (newest first)
            messages = messages.order_by('-timestamp')
            
            # Get limit and offset for pagination
            limit = int(request.GET.get('limit', 100))
            offset = int(request.GET.get('offset', 0))
            
            # Apply pagination
            paginated_messages = messages[offset:offset+limit]
            
            # Serialize the messages
            serializer = TaskChatSerializer(paginated_messages, many=True, context={'request': request})
            
            return JsonResponse({
                'status': 'success',
                'task_id': task.id,
                'task_name': task.task_name,
                'event_id': task.event.id,
                'event_name': task.event.event_name,
                'total_count': messages.count(),
                'returned_count': len(serializer.data),
                'has_more': messages.count() > (offset + limit),
                'messages': serializer.data
            })
            
        except Exception as e:
            print(f"Error in TaskChatHistoryView: {str(e)}")
            print(traceback.format_exc())
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            }, status=500)

@method_decorator(csrf_exempt, name='dispatch')
class RecentTaskChatsView(View):
    """
    View for getting recent chats across all tasks the user is assigned to
    """
    def get(self, request):
        try:
            # Check authentication
            if not request.user.is_authenticated:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Authentication required'
                }, status=401)
            
            # Get user's tasks
            if request.user.isHost:
                # For hosts, get tasks from events they are hosting
                user_events = request.user.hosted_events.all()
                user_tasks = TaskInfo.objects.filter(event__in=user_events)
            else:
                # For volunteers, get tasks they are assigned to
                user_tasks = request.user.assigned_tasks.all()
            
            # Get task ids
            task_ids = list(user_tasks.values_list('id', flat=True))
            
            # Get limit for number of messages per task
            limit = int(request.GET.get('limit', 5))
            
            # Get recent messages for these tasks
            recent_chats_by_task = {}
            
            for task_id in task_ids:
                try:
                    task = TaskInfo.objects.get(id=task_id)
                    messages = task.messages.all().order_by('-timestamp')[:limit]
                    
                    if messages.exists():
                        serializer = TaskChatSerializer(messages, many=True, context={'request': request})
                        recent_chats_by_task[task_id] = {
                            'task_id': task_id,
                            'task_name': task.task_name,
                            'event_id': task.event.id,
                            'event_name': task.event.event_name,
                            'message_count': messages.count(),
                            'messages': serializer.data
                        }
                except TaskInfo.DoesNotExist:
                    continue
            
            return JsonResponse({
                'status': 'success',
                'task_count': len(recent_chats_by_task),
                'tasks': list(recent_chats_by_task.values())
            })
            
        except Exception as e:
            print(f"Error in RecentTaskChatsView: {str(e)}")
            print(traceback.format_exc())
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            }, status=500)