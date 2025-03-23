from rest_framework import viewsets
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from ..models import TaskInfo, EventInfo, User, SubTask
from ..serializers.task import TaskInfoSerializer, SubTaskSerializer, TaskWithSubtasksSerializer
import json
import traceback
from django.shortcuts import get_object_or_404
from django.utils import timezone

class TaskViewSet(viewsets.ModelViewSet):
    queryset = TaskInfo.objects.all()
    serializer_class = TaskInfoSerializer

    def create(self, request, *args, **kwargs):
        # Ensure user is authenticated before creating a task
        if not request.user.is_authenticated:
            return JsonResponse({'status': 'error', 'message': 'Authentication required'}, status=401)
        return super().create(request, *args, **kwargs)

@method_decorator(csrf_exempt, name='dispatch')
class AddTaskToEventView(View):
    """Add a new task to an event"""
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
            
            # Get event_id from request data
            event_id = data.get('event_id')
            if not event_id:
                return JsonResponse({
                    'status': 'error', 
                    'message': 'Event ID is required'
                }, status=400)
                
            # Find the event
            try:
                event = EventInfo.objects.get(id=event_id)
            except EventInfo.DoesNotExist:
                return JsonResponse({
                    'status': 'error', 
                    'message': 'Event not found'
                }, status=404)
                
            # Create task data dictionary
            task_data = {
                'event': event.id,
                'task_name': data.get('task_name'),
                'description': data.get('description', ''),
                'start_time': data.get('start_time'),
                'end_time': data.get('end_time'),
                'status': data.get('status', 'Pending'),
                'volunteer_efficiency': data.get('volunteer_efficiency', 0),
                'task_analysis': data.get('task_analysis', '')
            }
            
            # Create the task
            serializer = TaskInfoSerializer(data=task_data)
            if serializer.is_valid():
                task = serializer.save()
                
                # Add volunteers if provided
                volunteer_ids = data.get('volunteer_ids', [])
                if volunteer_ids:
                    for volunteer_id in volunteer_ids:
                        try:
                            volunteer = User.objects.get(id=volunteer_id, isHost=False)
                            task.volunteers.add(volunteer)
                        except User.DoesNotExist:
                            # We'll just skip volunteers that don't exist
                            pass
                
                # Re-serialize with the volunteers added
                serializer = TaskInfoSerializer(task)
                return JsonResponse({
                    'status': 'success', 
                    'message': 'Task created successfully',
                    'task': serializer.data
                }, status=201)
            else:
                return JsonResponse({
                    'status': 'error', 
                    'message': serializer.errors
                }, status=400)
                
        except Exception as e:
            print(f"Error in AddTaskToEventView: {str(e)}")
            print(traceback.format_exc())
            return JsonResponse({
                'status': 'error', 
                'message': str(e)
            }, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class AddSubtaskView(View):
    """Add a subtask to a parent task"""
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
            
            # Get task_id from request data
            task_id = data.get('task_id')
            if not task_id:
                return JsonResponse({
                    'status': 'error', 
                    'message': 'Task ID is required'
                }, status=400)
                
            # Find the parent task
            try:
                parent_task = TaskInfo.objects.get(id=task_id)
            except TaskInfo.DoesNotExist:
                return JsonResponse({
                    'status': 'error', 
                    'message': 'Parent task not found'
                }, status=404)
                
            # Create subtask data
            subtask_data = {
                'parent_task': parent_task.id,
                'title': data.get('title'),
                'description': data.get('description', ''),
                'start_time': data.get('start_time'),
                'end_time': data.get('end_time'),
                'status': data.get('status', 'Pending')
            }
            
            # Create the subtask
            serializer = SubTaskSerializer(data=subtask_data)
            if serializer.is_valid():
                subtask = serializer.save()
                return JsonResponse({
                    'status': 'success', 
                    'message': 'Subtask created successfully',
                    'subtask': serializer.data
                }, status=201)
            else:
                return JsonResponse({
                    'status': 'error', 
                    'message': serializer.errors
                }, status=400)
                
        except Exception as e:
            print(f"Error in AddSubtaskView: {str(e)}")
            print(traceback.format_exc())
            return JsonResponse({
                'status': 'error', 
                'message': str(e)
            }, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class AssignVolunteerToTaskView(View):
    """Assign volunteers to a task"""
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
            
            # Get task_id and volunteer_ids from request data
            task_id = data.get('task_id')
            volunteer_ids = data.get('volunteer_ids', [])
            
            if not task_id:
                return JsonResponse({
                    'status': 'error', 
                    'message': 'Task ID is required'
                }, status=400)
                
            if not volunteer_ids:
                return JsonResponse({
                    'status': 'error', 
                    'message': 'At least one volunteer ID is required'
                }, status=400)
                
            # Find the task
            try:
                task = TaskInfo.objects.get(id=task_id)
            except TaskInfo.DoesNotExist:
                return JsonResponse({
                    'status': 'error', 
                    'message': 'Task not found'
                }, status=404)
            
            # Clear existing volunteers if replace flag is set
            if data.get('replace', False):
                task.volunteers.clear()
                
            # Add new volunteers
            added_volunteers = []
            not_found_volunteers = []
            
            for volunteer_id in volunteer_ids:
                try:
                    volunteer = User.objects.get(id=volunteer_id, isHost=False)
                    task.volunteers.add(volunteer)
                    added_volunteers.append({
                        'id': volunteer.id,
                        'name': volunteer.name,
                        'email': volunteer.email
                    })
                except User.DoesNotExist:
                    not_found_volunteers.append(volunteer_id)
            
            # Return the updated task
            serializer = TaskInfoSerializer(task)
            response = {
                'status': 'success', 
                'message': 'Volunteers assigned successfully',
                'task': serializer.data,
                'added_volunteers': added_volunteers
            }
            
            if not_found_volunteers:
                response['not_found_volunteers'] = not_found_volunteers
                
            return JsonResponse(response)
                
        except Exception as e:
            print(f"Error in AssignVolunteerToTaskView: {str(e)}")
            print(traceback.format_exc())
            return JsonResponse({
                'status': 'error', 
                'message': str(e)
            }, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class EditTaskView(View):
    """Edit task details"""
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
            
            # Get task_id from request data
            task_id = data.get('task_id')
            if not task_id:
                return JsonResponse({
                    'status': 'error', 
                    'message': 'Task ID is required'
                }, status=400)
                
            # Find the task
            try:
                task = TaskInfo.objects.get(id=task_id)
            except TaskInfo.DoesNotExist:
                return JsonResponse({
                    'status': 'error', 
                    'message': 'Task not found'
                }, status=404)
                
            # Create task data dictionary with provided fields
            task_data = {}
            for field in ['task_name', 'description', 'start_time', 'end_time', 'status', 
                         'volunteer_efficiency', 'task_analysis']:
                if field in data:
                    task_data[field] = data.get(field)
            
            # Update the task
            serializer = TaskInfoSerializer(task, data=task_data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return JsonResponse({
                    'status': 'success', 
                    'message': 'Task updated successfully',
                    'task': serializer.data
                })
            else:
                return JsonResponse({
                    'status': 'error', 
                    'message': serializer.errors
                }, status=400)
                
        except Exception as e:
            print(f"Error in EditTaskView: {str(e)}")
            print(traceback.format_exc())
            return JsonResponse({
                'status': 'error', 
                'message': str(e)
            }, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class DeleteTaskView(View):
    """Delete a task"""
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
            
            # Get task_id from request data
            task_id = data.get('task_id')
            if not task_id:
                return JsonResponse({
                    'status': 'error', 
                    'message': 'Task ID is required'
                }, status=400)
                
            # Find the task
            try:
                task = TaskInfo.objects.get(id=task_id)
            except TaskInfo.DoesNotExist:
                return JsonResponse({
                    'status': 'error', 
                    'message': 'Task not found'
                }, status=404)
                
            # Delete the task
            task_name = task.task_name
            task.delete()
            
            return JsonResponse({
                'status': 'success', 
                'message': f'Task "{task_name}" deleted successfully'
            })
                
        except Exception as e:
            print(f"Error in DeleteTaskView: {str(e)}")
            print(traceback.format_exc())
            return JsonResponse({
                'status': 'error', 
                'message': str(e)
            }, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class NotifyTaskCompletionView(View):
    """Volunteers notify that a task is completed"""
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
            
            # Get task_id from request data
            task_id = data.get('task_id')
            if not task_id:
                return JsonResponse({
                    'status': 'error', 
                    'message': 'Task ID is required'
                }, status=400)
                
            # Find the task
            try:
                task = TaskInfo.objects.get(id=task_id)
            except TaskInfo.DoesNotExist:
                return JsonResponse({
                    'status': 'error', 
                    'message': 'Task not found'
                }, status=404)
                
            # Check if the authenticated user is assigned to this task
            if request.user not in task.volunteers.all():
                return JsonResponse({
                    'status': 'error', 
                    'message': 'You are not assigned to this task'
                }, status=403)
                
            # Get notification message
            message = data.get('message', f'Task completed by {request.user.name}')
            
            # Update task with notification
            task.completion_notified = True
            task.notification_message = message
            task.notification_time = timezone.now()
            task.save()
            
            # Return the updated task
            serializer = TaskInfoSerializer(task)
            return JsonResponse({
                'status': 'success', 
                'message': 'Task completion notification sent successfully',
                'task': serializer.data
            })
                
        except Exception as e:
            print(f"Error in NotifyTaskCompletionView: {str(e)}")
            print(traceback.format_exc())
            return JsonResponse({
                'status': 'error', 
                'message': str(e)
            }, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class NotifySubtaskCompletionView(View):
    """Volunteers notify that a subtask is completed"""
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
            
            # Get subtask_id from request data
            subtask_id = data.get('subtask_id')
            if not subtask_id:
                return JsonResponse({
                    'status': 'error', 
                    'message': 'Subtask ID is required'
                }, status=400)
                
            # Find the subtask
            try:
                subtask = SubTask.objects.get(id=subtask_id)
            except SubTask.DoesNotExist:
                return JsonResponse({
                    'status': 'error', 
                    'message': 'Subtask not found'
                }, status=404)
                
            # Check if the authenticated user is assigned to the parent task
            if request.user not in subtask.parent_task.volunteers.all():
                return JsonResponse({
                    'status': 'error', 
                    'message': 'You are not assigned to the task that contains this subtask'
                }, status=403)
                
            # Get notification message
            message = data.get('message', f'Subtask completed by {request.user.name}')
            
            # Update subtask with notification
            subtask.completion_notified = True
            subtask.notification_message = message
            subtask.notification_time = timezone.now()
            subtask.save()
            
            # Return the updated subtask
            serializer = SubTaskSerializer(subtask)
            return JsonResponse({
                'status': 'success', 
                'message': 'Subtask completion notification sent successfully',
                'subtask': serializer.data
            })
                
        except Exception as e:
            print(f"Error in NotifySubtaskCompletionView: {str(e)}")
            print(traceback.format_exc())
            return JsonResponse({
                'status': 'error', 
                'message': str(e)
            }, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class GetNotifiedTasksView(View):
    """Get all tasks with completion notifications"""
    def get(self, request):
        try:
            # Check authentication
            if not request.user.is_authenticated:
                return JsonResponse({
                    'status': 'error', 
                    'message': 'Authentication required'
                }, status=401)
                
            # Check if user is a host
            if not request.user.isHost:
                return JsonResponse({
                    'status': 'error', 
                    'message': 'Only hosts can view task notifications'
                }, status=403)
                
            # Get event_id from query parameters if provided
            event_id = request.GET.get('event_id')
            
            # Filter tasks with notifications
            tasks_query = TaskInfo.objects.filter(completion_notified=True)
            
            # Filter by event if specified
            if event_id:
                tasks_query = tasks_query.filter(event_id=event_id)
                
            # Get the tasks
            tasks = tasks_query.order_by('-notification_time')
            
            # Serialize the tasks
            serializer = TaskInfoSerializer(tasks, many=True)
            
            return JsonResponse({
                'status': 'success',
                'count': len(serializer.data),
                'tasks': serializer.data
            })
                
        except Exception as e:
            print(f"Error in GetNotifiedTasksView: {str(e)}")
            print(traceback.format_exc())
            return JsonResponse({
                'status': 'error', 
                'message': str(e)
            }, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class GetNotifiedSubtasksView(View):
    """Get all subtasks with completion notifications for a task"""
    def get(self, request):
        try:
            # Check authentication
            if not request.user.is_authenticated:
                return JsonResponse({
                    'status': 'error', 
                    'message': 'Authentication required'
                }, status=401)
                
            # Check if user is a host
            if not request.user.isHost:
                return JsonResponse({
                    'status': 'error', 
                    'message': 'Only hosts can view subtask notifications'
                }, status=403)
                
            # Get task_id from query parameters
            task_id = request.GET.get('task_id')
            if not task_id:
                return JsonResponse({
                    'status': 'error', 
                    'message': 'Task ID is required'
                }, status=400)
                
            # Find the task
            try:
                task = TaskInfo.objects.get(id=task_id)
            except TaskInfo.DoesNotExist:
                return JsonResponse({
                    'status': 'error', 
                    'message': 'Task not found'
                }, status=404)
                
            # Get all subtasks with notifications for this task
            subtasks = task.subtasks.filter(completion_notified=True).order_by('-notification_time')
            
            # Serialize the subtasks
            serializer = SubTaskSerializer(subtasks, many=True)
            
            return JsonResponse({
                'status': 'success',
                'task_id': task.id,
                'task_name': task.task_name,
                'count': len(serializer.data),
                'subtasks': serializer.data
            })
                
        except Exception as e:
            print(f"Error in GetNotifiedSubtasksView: {str(e)}")
            print(traceback.format_exc())
            return JsonResponse({
                'status': 'error', 
                'message': str(e)
            }, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class MarkTaskCompleteView(View):
    """Host marks a task as complete"""
    def post(self, request):
        try:
            # Check authentication
            if not request.user.is_authenticated:
                return JsonResponse({
                    'status': 'error', 
                    'message': 'Authentication required'
                }, status=401)
                
            # Check if user is a host
            if not request.user.isHost:
                return JsonResponse({
                    'status': 'error', 
                    'message': 'Only hosts can mark tasks as complete'
                }, status=403)
                
            # Parse request data
            data = request.POST if request.POST else json.loads(request.body)
            
            # Get task_id from request data
            task_id = data.get('task_id')
            if not task_id:
                return JsonResponse({
                    'status': 'error', 
                    'message': 'Task ID is required'
                }, status=400)
                
            # Find the task
            try:
                task = TaskInfo.objects.get(id=task_id)
            except TaskInfo.DoesNotExist:
                return JsonResponse({
                    'status': 'error', 
                    'message': 'Task not found'
                }, status=404)
                
            # Check if the task has subtasks that are not complete
            incomplete_subtasks = task.subtasks.exclude(status='Completed')
            if incomplete_subtasks.exists():
                return JsonResponse({
                    'status': 'error', 
                    'message': 'Cannot mark task as complete - it has incomplete subtasks',
                    'incomplete_subtasks': list(incomplete_subtasks.values('id', 'title', 'status'))
                }, status=400)
                
            # Update task status
            task.status = 'Completed'
            task.completion_notified = False  # Reset notification since host has acknowledged it
            task.save()
            
            # Return the updated task
            serializer = TaskInfoSerializer(task)
            return JsonResponse({
                'status': 'success', 
                'message': 'Task marked as complete',
                'task': serializer.data
            })
                
        except Exception as e:
            print(f"Error in MarkTaskCompleteView: {str(e)}")
            print(traceback.format_exc())
            return JsonResponse({
                'status': 'error', 
                'message': str(e)
            }, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class MarkSubtaskCompleteView(View):
    """Host marks a subtask as complete"""
    def post(self, request):
        try:
            # Check authentication
            if not request.user.is_authenticated:
                return JsonResponse({
                    'status': 'error', 
                    'message': 'Authentication required'
                }, status=401)
                
            # Check if user is a host
            if not request.user.isHost:
                return JsonResponse({
                    'status': 'error', 
                    'message': 'Only hosts can mark subtasks as complete'
                }, status=403)
                
            # Parse request data
            data = request.POST if request.POST else json.loads(request.body)
            
            # Get subtask_id from request data
            subtask_id = data.get('subtask_id')
            if not subtask_id:
                return JsonResponse({
                    'status': 'error', 
                    'message': 'Subtask ID is required'
                }, status=400)
                
            # Find the subtask
            try:
                subtask = SubTask.objects.get(id=subtask_id)
            except SubTask.DoesNotExist:
                return JsonResponse({
                    'status': 'error', 
                    'message': 'Subtask not found'
                }, status=404)
                
            # Update subtask status
            subtask.status = 'Completed'
            subtask.completion_notified = False  # Reset notification since host has acknowledged it
            subtask.save()
            
            # Return the updated subtask and check if parent task is now complete
            parent_task = subtask.parent_task
            all_complete = parent_task.all_subtasks_complete
            
            serializer = SubTaskSerializer(subtask)
            return JsonResponse({
                'status': 'success', 
                'message': 'Subtask marked as complete',
                'subtask': serializer.data,
                'all_subtasks_complete': all_complete,
                'parent_task_id': parent_task.id,
                'parent_task_updated': all_complete
            })
                
        except Exception as e:
            print(f"Error in MarkSubtaskCompleteView: {str(e)}")
            print(traceback.format_exc())
            return JsonResponse({
                'status': 'error', 
                'message': str(e)
            }, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class GetTaskWithSubtasksView(View):
    """Get detailed information about a task and all its subtasks"""
    def get(self, request):
        try:
            # Get task_id from query parameters
            task_id = request.GET.get('task_id')
            
            if not task_id:
                return JsonResponse({
                    'status': 'error', 
                    'message': 'Task ID is required'
                }, status=400)
                
            # Find the task
            try:
                task = TaskInfo.objects.get(id=task_id)
            except TaskInfo.DoesNotExist:
                return JsonResponse({
                    'status': 'error', 
                    'message': 'Task not found'
                }, status=404)
                
            # Serialize the task with its subtasks
            serializer = TaskWithSubtasksSerializer(task)
            
            return JsonResponse({
                'status': 'success',
                'task': serializer.data
            })
            
        except Exception as e:
            print(f"Error in GetTaskWithSubtasksView: {str(e)}")
            print(traceback.format_exc())
            return JsonResponse({
                'status': 'error', 
                'message': str(e)
            }, status=500)
    
    def post(self, request):
        # POST method can use the same logic as GET for this view
        return self.get(request)