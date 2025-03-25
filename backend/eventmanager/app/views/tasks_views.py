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
from django.db.models import Count, Q

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
    """Add a new task to an event with skills support"""
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
                    'message': 'Only hosts can add tasks'
                }, status=403)
                
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
            
            # Check if the current user is the host of this event
            if event.host != request.user:
                return JsonResponse({
                    'status': 'error', 
                    'message': 'You can only add tasks to events you are hosting'
                }, status=403)
                
            # Process skills field - normalize formatting
            skills = data.get('required_skills', '')
            if isinstance(skills, list):
                # If skills came as a list, convert to comma-separated string
                skills = ', '.join(skills)
            
            # Create task data dictionary
            task_data = {
                'event': event.id,
                'task_name': data.get('task_name'),
                'description': data.get('description', ''),
                'start_time': data.get('start_time'),
                'end_time': data.get('end_time'),
                'status': data.get('status', 'Pending'),
                'required_skills': skills,
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
    """Assign volunteers to a task with skill matching info"""
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
                    'message': 'Only hosts can assign volunteers'
                }, status=403)
                
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
            
            # Check if the current user is the host of this event
            if task.event.host != request.user:
                return JsonResponse({
                    'status': 'error', 
                    'message': 'You can only assign volunteers to tasks for events you are hosting'
                }, status=403)
                
            # Clear existing volunteers if replace flag is set
            if data.get('replace', False):
                task.volunteers.clear()
                
            # Add new volunteers with skill matching info
            added_volunteers = []
            not_found_volunteers = []
            
            # Get task required skills
            task_skills = set()
            if task.required_skills:
                task_skills = set(s.strip().lower() for s in task.required_skills.split(',') if s.strip())
            
            for volunteer_id in volunteer_ids:
                try:
                    volunteer = User.objects.get(id=volunteer_id, isHost=False)
                    
                    # Check if volunteer is enrolled in the event
                    if volunteer not in task.event.volunteer_enrolled.all():
                        not_found_volunteers.append({
                            'id': volunteer_id,
                            'reason': f'Volunteer is not enrolled in this event'
                        })
                        continue
                    
                    # Add volunteer to task
                    task.volunteers.add(volunteer)
                    
                    # Calculate skill match information
                    skill_match = False
                    matching_skills = []
                    missing_skills = []
                    match_percentage = 0
                    
                    if task_skills and volunteer.skills:
                        volunteer_skills = set(s.strip().lower() for s in volunteer.skills.split(',') if s.strip())
                        matching_skills = list(task_skills.intersection(volunteer_skills))
                        missing_skills = list(task_skills - volunteer_skills)
                        skill_match = len(matching_skills) > 0
                        
                        if task_skills:
                            match_percentage = round((len(matching_skills) / len(task_skills)) * 100)
                    
                    added_volunteers.append({
                        'id': volunteer.id,
                        'name': volunteer.name,
                        'email': volunteer.email,
                        'skills': volunteer.skills.split(',') if volunteer.skills else [],
                        'skill_match': skill_match,
                        'match_percentage': match_percentage,
                        'matching_skills': matching_skills,
                        'missing_skills': missing_skills
                    })
                    
                except User.DoesNotExist:
                    not_found_volunteers.append({
                        'id': volunteer_id,
                        'reason': 'Volunteer not found'
                    })
            
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
    """Edit task details including skills"""
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
                    'message': 'Only hosts can edit tasks'
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
                
            # Check if the current user is the host of this event
            if task.event.host != request.user:
                return JsonResponse({
                    'status': 'error', 
                    'message': 'You can only edit tasks for events you are hosting'
                }, status=403)
                
            # Process skills field if provided
            if 'required_skills' in data:
                skills = data.get('required_skills')
                if isinstance(skills, list):
                    # If skills came as a list, convert to comma-separated string
                    data['required_skills'] = ', '.join(skills)
            
            # Create task data dictionary with provided fields
            task_data = {}
            for field in ['task_name', 'description', 'start_time', 'end_time', 'status', 
                         'required_skills', 'volunteer_efficiency', 'task_analysis']:
                if field in data:
                    task_data[field] = data.get(field)
            
            # Update the task
            serializer = TaskInfoSerializer(task, data=task_data, partial=True)
            if serializer.is_valid():
                task = serializer.save()
                
                # Check if we need to update volunteers and recalculate skill matches
                if 'volunteer_ids' in data:
                    # Clear existing volunteers
                    task.volunteers.clear()
                    
                    # Add new volunteers
                    volunteer_ids = data.get('volunteer_ids', [])
                    volunteers_info = []
                    
                    # Get task required skills
                    task_skills = set()
                    if task.required_skills:
                        task_skills = set(s.strip().lower() for s in task.required_skills.split(',') if s.strip())
                    
                    for volunteer_id in volunteer_ids:
                        try:
                            volunteer = User.objects.get(id=volunteer_id, isHost=False)
                            task.volunteers.add(volunteer)
                            
                            # Calculate skill match information
                            skill_match = False
                            matching_skills = []
                            missing_skills = []
                            match_percentage = 0
                            
                            if task_skills and volunteer.skills:
                                volunteer_skills = set(s.strip().lower() for s in volunteer.skills.split(',') if s.strip())
                                matching_skills = list(task_skills.intersection(volunteer_skills))
                                missing_skills = list(task_skills - volunteer_skills)
                                skill_match = len(matching_skills) > 0
                                
                                if task_skills:
                                    match_percentage = round((len(matching_skills) / len(task_skills)) * 100)
                            
                            volunteers_info.append({
                                'id': volunteer.id,
                                'name': volunteer.name,
                                'skill_match': skill_match,
                                'match_percentage': match_percentage,
                                'matching_skills': matching_skills,
                                'missing_skills': missing_skills
                            })
                            
                        except User.DoesNotExist:
                            # Skip volunteers that don't exist
                            pass
                    
                    # Re-serialize after adding volunteers
                    serializer = TaskInfoSerializer(task)
                    
                    return JsonResponse({
                        'status': 'success', 
                        'message': 'Task updated successfully with volunteer assignments',
                        'task': serializer.data,
                        'volunteers': volunteers_info
                    })
                
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
                
            # Check if user is a host
            if not request.user.isHost:
                return JsonResponse({
                    'status': 'error', 
                    'message': 'Only hosts can delete tasks'
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
                
            # Check if the current user is the host of this event
            if task.event.host != request.user:
                return JsonResponse({
                    'status': 'error', 
                    'message': 'You can only delete tasks for events you are hosting'
                }, status=403)
                
            # Store task info for response
            task_name = task.task_name
            event_name = task.event.event_name
            
            # Delete the task
            task.delete()
            
            return JsonResponse({
                'status': 'success', 
                'message': f'Task "{task_name}" for event "{event_name}" deleted successfully'
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
            
            # Add skills information and volunteer matches
            task_data = serializer.data
            for i, task in enumerate(task_data):
                task_obj = tasks[i]
                task_data[i]['skills_list'] = task_obj.get_skills_list()
                
                # Get volunteer skill matches for this task
                volunteers_info = []
                task_skills = set(s.strip().lower() for s in task_obj.required_skills.split(',') if s.strip())
                
                for volunteer in task_obj.volunteers.all():
                    volunteer_skills = set(s.strip().lower() for s in volunteer.skills.split(',') if s.strip())
                    matching_skills = list(task_skills.intersection(volunteer_skills))
                    skill_match = len(matching_skills) > 0
                    match_percentage = round((len(matching_skills) / len(task_skills)) * 100) if task_skills else 0
                    
                    volunteers_info.append({
                        'id': volunteer.id,
                        'name': volunteer.name,
                        'skill_match': skill_match,
                        'match_percentage': match_percentage,
                        'matching_skills': matching_skills
                    })
                
                task_data[i]['volunteers_info'] = volunteers_info
            
            return JsonResponse({
                'status': 'success',
                'count': len(task_data),
                'tasks': task_data
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
            
            # Include task skills info for context
            skills_list = task.get_skills_list()
            
            return JsonResponse({
                'status': 'success',
                'task_id': task.id,
                'task_name': task.task_name,
                'required_skills': skills_list,
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
            task_data = serializer.data
            task_data['skills_list'] = task.get_skills_list()
            
            return JsonResponse({
                'status': 'success', 
                'message': 'Task marked as complete',
                'task': task_data
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
    """Get detailed information about a task and all its subtasks with skill information"""
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
            
            # Check if the user has access to this task
            if not request.user.is_authenticated:
                # Unauthenticated users can only see public event tasks
                if task.event.visibility != 'Public':
                    return JsonResponse({
                        'status': 'error', 
                        'message': 'Authentication required to view this task'
                    }, status=401)
            elif not (request.user.isHost or request.user == task.event.host or request.user in task.volunteers.all()):
                # Only hosts, event hosts, or assigned volunteers can see task details
                # unless the event is public
                if task.event.visibility != 'Public':
                    return JsonResponse({
                        'status': 'error', 
                        'message': 'You do not have permission to view this task'
                    }, status=403)
                
            # Serialize task
            serializer = TaskInfoSerializer(task)
            task_data = serializer.data
            
            # Add skills information
            skills_list = task.get_skills_list()
            task_data['skills_list'] = skills_list
            
            # Get subtasks
            subtasks = task.subtasks.all().order_by('start_time')
            subtask_serializer = SubTaskSerializer(subtasks, many=True)
            
            # Get volunteers with skill matching info
            volunteers = []
            for volunteer in task.volunteers.all():
                # Calculate skill match
                skill_match = False
                matching_skills = []
                missing_skills = []
                match_percentage = 0
                
                if skills_list and volunteer.skills:
                    task_skills = set(s.strip().lower() for s in skills_list)
                    volunteer_skills = set(s.strip().lower() for s in volunteer.skills.split(',') if s.strip())
                    matching_skills = list(task_skills.intersection(volunteer_skills))
                    missing_skills = list(task_skills - volunteer_skills)
                    skill_match = len(matching_skills) > 0
                    match_percentage = round((len(matching_skills) / len(task_skills)) * 100) if task_skills else 0
                
                volunteers.append({
                    'id': volunteer.id,
                    'name': volunteer.name,
                    'email': volunteer.email,
                    'contact': volunteer.contact,
                    'skills': volunteer.skills.split(',') if volunteer.skills else [],
                    'skill_match': skill_match,
                    'match_percentage': match_percentage,
                    'matching_skills': matching_skills,
                    'missing_skills': missing_skills
                })
            
            # Include skill details
            skills_data = {
                'required_skills': skills_list,
                'has_skills_defined': bool(task.required_skills)
            }
            
            return JsonResponse({
                'status': 'success',
                'task': task_data,
                'subtasks': subtask_serializer.data,
                'volunteers': volunteers,
                'skills': skills_data,
                'event_name': task.event.event_name
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


@method_decorator(csrf_exempt, name='dispatch')
class GetVolunteerTasksView(View):
    """Get all tasks assigned to a specific volunteer with skill matching information"""
    def get(self, request):
        try:
            # Check authentication
            if not request.user.is_authenticated:
                return JsonResponse({
                    'status': 'error', 
                    'message': 'Authentication required'
                }, status=401)
                
            # Get volunteer_id from query parameters (optional, defaults to the authenticated user)
            volunteer_id = request.GET.get('volunteer_id')
            
            # If volunteer_id is provided, the user must be a host to view other volunteers' tasks
            if volunteer_id and volunteer_id != str(request.user.id):
                if not request.user.isHost:
                    return JsonResponse({
                        'status': 'error', 
                        'message': 'Only hosts can view tasks assigned to other volunteers'
                    }, status=403)
                
                # Find the volunteer
                try:
                    volunteer = User.objects.get(id=volunteer_id, isHost=False)
                except User.DoesNotExist:
                    return JsonResponse({
                        'status': 'error', 
                        'message': 'Volunteer not found'
                    }, status=404)
            else:
                # Use the authenticated user
                volunteer = request.user
                
                # Make sure the user is not a host (hosts don't have tasks assigned)
                if volunteer.isHost:
                    return JsonResponse({
                        'status': 'error', 
                        'message': 'Hosts are not assigned tasks as volunteers'
                    }, status=400)
            
            # Get optional filter parameters
            status_filter = request.GET.get('status')
            event_id = request.GET.get('event_id')
            skill_match = request.GET.get('skill_match') == 'true'
            
            # Get tasks assigned to this volunteer
            tasks = TaskInfo.objects.filter(volunteers=volunteer)
            
            # Apply filters if provided
            if status_filter:
                tasks = tasks.filter(status=status_filter)
                
            if event_id:
                tasks = tasks.filter(event_id=event_id)
                
            # Order by start_time
            tasks = tasks.order_by('start_time')
            
            # Serialize the tasks
            serializer = TaskInfoSerializer(tasks, many=True)
            task_data = serializer.data
            
            # Parse volunteer skills once
            volunteer_skills = set()
            if volunteer.skills:
                volunteer_skills = set(s.strip().lower() for s in volunteer.skills.split(',') if s.strip())
            
            # Add event names and skill matching info
            for i, task in enumerate(task_data):
                # Add event name
                try:
                    event = EventInfo.objects.get(id=task['event'])
                    task_data[i]['event_name'] = event.event_name
                except EventInfo.DoesNotExist:
                    task_data[i]['event_name'] = 'Unknown Event'
                
                # Add skill matching info
                task_obj = tasks[i]
                task_skills = set()
                if task_obj.required_skills:
                    task_skills = set(s.strip().lower() for s in task_obj.required_skills.split(',') if s.strip())
                
                if task_skills and volunteer_skills:
                    matching_skills = list(task_skills.intersection(volunteer_skills))
                    missing_skills = list(task_skills - volunteer_skills)
                    
                    # Calculate match percentage
                    match_percentage = round((len(matching_skills) / len(task_skills)) * 100) if task_skills else 0
                    
                    task_data[i]['skill_match'] = len(matching_skills) > 0
                    task_data[i]['match_percentage'] = match_percentage
                    task_data[i]['matching_skills'] = matching_skills
                    task_data[i]['missing_skills'] = missing_skills
                else:
                    task_data[i]['skill_match'] = False
                    task_data[i]['match_percentage'] = 0
                    task_data[i]['matching_skills'] = []
                    task_data[i]['missing_skills'] = list(task_skills) if task_skills else []
                
                # Add skills list
                task_data[i]['skills_list'] = task_obj.get_skills_list()
            
            # Filter by skill match if requested
            if skill_match:
                task_data = [task for task in task_data if task.get('skill_match', False)]
            
            # Add volunteer skills
            volunteer_skills_list = volunteer.skills.split(',') if volunteer.skills else []
            volunteer_skills_list = [s.strip() for s in volunteer_skills_list if s.strip()]
            
            return JsonResponse({
                'status': 'success',
                'volunteer_id': volunteer.id,
                'volunteer_name': volunteer.name,
                'volunteer_skills': volunteer_skills_list,
                'count': len(task_data),
                'tasks': task_data
            })
            
        except Exception as e:
            print(f"Error in GetVolunteerTasksView: {str(e)}")
            print(traceback.format_exc())
            return JsonResponse({
                'status': 'error', 
                'message': str(e)
            }, status=500)
    
    def post(self, request):
        # POST method can use the same logic as GET for this view
        return self.get(request)


@method_decorator(csrf_exempt, name='dispatch')
class GetEventTasksView(View):
    """Get all tasks for a specific event with skill and status information"""
    def get(self, request):
        try:
            # Get event_id from query parameters
            event_id = request.GET.get('event_id')
            
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
            
            # Check authentication for non-public events
            if hasattr(event, 'visibility') and event.visibility != 'Public' and not request.user.is_authenticated:
                return JsonResponse({
                    'status': 'error', 
                    'message': 'Authentication required to view tasks for this event'
                }, status=401)
            
            # For private events, only hosts and enrolled volunteers can view tasks
            if hasattr(event, 'visibility') and event.visibility == 'Private' and request.user.is_authenticated:
                if not (request.user.isHost or request.user == event.host or request.user in event.volunteer_enrolled.all()):
                    return JsonResponse({
                        'status': 'error', 
                        'message': 'You do not have access to view tasks for this event'
                    }, status=403)
            
            # Get optional filter parameters
            status_filter = request.GET.get('status')
            volunteer_id = request.GET.get('volunteer_id')
            skill_filter = request.GET.get('skill')
            
            # Get tasks for this event
            tasks = TaskInfo.objects.filter(event=event)
            
            # Apply filters if provided
            if status_filter:
                tasks = tasks.filter(status=status_filter)
                
            if volunteer_id:
                try:
                    volunteer = User.objects.get(id=volunteer_id)
                    tasks = tasks.filter(volunteers=volunteer)
                except User.DoesNotExist:
                    # If volunteer doesn't exist, return empty list rather than error
                    tasks = TaskInfo.objects.none()
                    
            if skill_filter:
                # Filter tasks that require this skill
                tasks = tasks.filter(required_skills__icontains=skill_filter)
            
            # Order by start_time
            tasks = tasks.order_by('start_time')
            
            # Get task counts by status
            status_counts = {
                'Pending': tasks.filter(status='Pending').count(),
                'In Progress': tasks.filter(status='In Progress').count(),
                'Completed': tasks.filter(status='Completed').count(),
                'Cancelled': tasks.filter(status='Cancelled').count(),
                'Delayed': tasks.filter(status='Delayed').count() if 'Delayed' in dict(TaskInfo.STATUS_CHOICES) else 0
            }
            
            # Get volunteer count using aggregation (more efficient)
            from django.db.models import Count
            total_volunteers = tasks.aggregate(
                total=Count('volunteers', distinct=True)
            )['total'] or 0
            
            # Serialize the tasks
            serializer = TaskInfoSerializer(tasks, many=True)
            task_data = serializer.data
            
            # Collect all skills used in this event's tasks
            all_skills = set()
            for task in tasks:
                if task.required_skills:
                    skills = [s.strip() for s in task.required_skills.split(',') if s.strip()]
                    all_skills.update(skills)
            
            # Count tasks by skill
            skill_counts = {}
            for skill in all_skills:
                count = tasks.filter(required_skills__icontains=skill).count()
                skill_counts[skill] = count
            
            # Add volunteer skill matches for each task if user is authenticated
            if request.user.is_authenticated:
                for i, task_item in enumerate(task_data):
                    task_obj = tasks[i]
                    
                    # Add skills list
                    task_data[i]['skills_list'] = task_obj.get_skills_list()
                    
                    # Add volunteer count
                    task_data[i]['volunteer_count'] = task_obj.volunteers.count()
                    
                    # If user is a volunteer, include their skill match info
                    if not request.user.isHost:
                        volunteer_skills = set()
                        if request.user.skills:
                            volunteer_skills = set(s.strip().lower() for s in request.user.skills.split(',') if s.strip())
                        
                        task_skills = set()
                        if task_obj.required_skills:
                            task_skills = set(s.strip().lower() for s in task_obj.required_skills.split(',') if s.strip())
                        
                        if task_skills and volunteer_skills:
                            matching_skills = list(task_skills.intersection(volunteer_skills))
                            match_percentage = round((len(matching_skills) / len(task_skills)) * 100) if task_skills else 0
                            
                            task_data[i]['user_skill_match'] = len(matching_skills) > 0
                            task_data[i]['user_match_percentage'] = match_percentage
                            task_data[i]['user_matching_skills'] = matching_skills
                        else:
                            task_data[i]['user_skill_match'] = False
                            task_data[i]['user_match_percentage'] = 0
                            task_data[i]['user_matching_skills'] = []
            
            return JsonResponse({
                'status': 'success',
                'event_id': event.id,
                'event_name': event.event_name,
                'count': len(task_data),
                'tasks': task_data,
                'status_counts': status_counts,
                'volunteer_count': total_volunteers,
                'skills': list(all_skills),
                'skill_counts': skill_counts
            })
            
        except Exception as e:
            print(f"Error in GetEventTasksView: {str(e)}")
            print(traceback.format_exc())
            return JsonResponse({
                'status': 'error', 
                'message': str(e)
            }, status=500)
    
    def post(self, request):
        # POST method can use the same logic as GET for this view
        return self.get(request)


@method_decorator(csrf_exempt, name='dispatch')
class SearchTasksBySkillView(View):
    """Search for tasks that require specific skills"""
    def get(self, request):
        try:
            # Get skill from query parameter
            skill = request.GET.get('skill')
            if not skill:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Skill parameter is required'
                }, status=400)
            
            # Get optional event_id filter
            event_id = request.GET.get('event_id')
            
            # Filter tasks by skill
            tasks = TaskInfo.objects.filter(required_skills__icontains=skill)
            
            # Apply event filter if provided
            if event_id:
                tasks = tasks.filter(event_id=event_id)
            
            # Check for visibility permissions
            if not request.user.is_authenticated:
                # For unauthenticated users, only show tasks from public events
                tasks = tasks.filter(event__visibility='Public')
            elif not request.user.isHost:
                # For volunteers, show tasks from public events and events they're enrolled in
                enrolled_events = request.user.enrolled_events.all()
                tasks = tasks.filter(
                    Q(event__visibility='Public') | 
                    Q(event__in=enrolled_events)
                )
            
            # Order by start_time
            tasks = tasks.order_by('start_time')
            
            # Serialize the tasks
            serializer = TaskInfoSerializer(tasks, many=True)
            task_data = serializer.data
            
            # Add event names and additional skill info
            for i, task in enumerate(task_data):
                # Add event name
                try:
                    event = EventInfo.objects.get(id=task['event'])
                    task_data[i]['event_name'] = event.event_name
                except EventInfo.DoesNotExist:
                    task_data[i]['event_name'] = 'Unknown Event'
                
                # Add skill info
                task_obj = tasks[i]
                skills_list = task_obj.get_skills_list()
                task_data[i]['skills_list'] = skills_list
                
                # Check if the query skill is in the list
                skill_lower = skill.lower()
                task_data[i]['skill_relevance'] = any(skill_lower in s.lower() for s in skills_list)
            
            return JsonResponse({
                'status': 'success',
                'search_skill': skill,
                'count': len(task_data),
                'tasks': task_data
            })
            
        except Exception as e:
            print(f"Error in SearchTasksBySkillView: {str(e)}")
            print(traceback.format_exc())
            return JsonResponse({
                'status': 'error', 
                'message': str(e)
            }, status=500)
    
    def post(self, request):
        # POST method can use the same logic as GET for this view
        return self.get(request)

@method_decorator(csrf_exempt, name='dispatch')
class DeleteSubtaskView(View):
    """Delete a subtask"""
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
                    'message': 'Only hosts can delete subtasks'
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
                
            # Get the parent task for later verification
            parent_task = subtask.parent_task
            
            # Check if the current user is the host of the event containing this subtask
            if parent_task.event.host != request.user:
                return JsonResponse({
                    'status': 'error', 
                    'message': 'You can only delete subtasks for events you are hosting'
                }, status=403)
                
            # Store subtask info for response
            subtask_title = subtask.title
            parent_task_name = parent_task.task_name
            
            # Delete the subtask
            subtask.delete()
            
            # Get updated list of remaining subtasks
            remaining_subtasks = SubTaskSerializer(
                parent_task.subtasks.all().order_by('start_time'),
                many=True
            ).data
            
            return JsonResponse({
                'status': 'success', 
                'message': f'Subtask "{subtask_title}" for task "{parent_task_name}" deleted successfully',
                'parent_task_id': parent_task.id,
                'remaining_subtasks': remaining_subtasks,
                'subtask_count': len(remaining_subtasks)
            })
                
        except Exception as e:
            print(f"Error in DeleteSubtaskView: {str(e)}")
            print(traceback.format_exc())
            return JsonResponse({
                'status': 'error', 
                'message': str(e)
            }, status=500)
    
    def delete(self, request):
        """Support DELETE HTTP method as well"""
        return self.post(request)