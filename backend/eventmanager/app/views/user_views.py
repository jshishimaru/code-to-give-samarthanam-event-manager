from rest_framework import viewsets
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from ..models import User, EventInfo, TaskInfo
from django.shortcuts import get_object_or_404
from django.db import models
import json
import traceback

@method_decorator(csrf_exempt, name='dispatch')
class EventVolunteersView(View):
    """
    Get all volunteers enrolled in a specific event
    """
    def get(self, request):
        try:
            # Check if user is authenticated
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
            
            # Check authorization - hosts can see all volunteers, volunteers can only see if they're enrolled
            is_host = request.user.isHost
            is_event_host = is_host and event.host_id == request.user.id
            is_enrolled = request.user in event.volunteer_enrolled.all()
            
            if not (is_host or is_enrolled):
                return JsonResponse({
                    'status': 'error',
                    'message': 'You do not have permission to view volunteers for this event'
                }, status=403)
            
            # Get all volunteers for the event
            volunteers = event.volunteer_enrolled.all()
            
            # Prepare response data
            volunteers_data = []
            for volunteer in volunteers:
                # Get tasks assigned to this volunteer in this event
                assigned_tasks = TaskInfo.objects.filter(
                    event=event,
                    volunteers=volunteer
                )
                
                volunteer_data = {
                    'id': volunteer.id,
                    'name': volunteer.name,
                    'skills': volunteer.skills,
                    'organization': volunteer.organization,
                    'location': volunteer.location,
                    'assigned_task_count': assigned_tasks.count(),
                }
                
                # Only include contact info for event hosts
                if is_event_host:
                    volunteer_data.update({
                        'email': volunteer.email,
                        'contact': volunteer.contact,
                    })
                
                volunteers_data.append(volunteer_data)
            
            return JsonResponse({
                'status': 'success',
                'event_id': event.id,
                'event_name': event.event_name,
                'volunteers': volunteers_data,
                'total_count': len(volunteers_data)
            })
            
        except Exception as e:
            print(f"Error in EventVolunteersView: {str(e)}")
            print(traceback.format_exc())
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            }, status=500)
    
    def post(self, request):
        # POST method can use the same logic as GET
        return self.get(request)


@method_decorator(csrf_exempt, name='dispatch')
class TaskVolunteersView(View):
    """
    Get all volunteers assigned to a specific task
    """
    def get(self, request):
        try:
            # Check if user is authenticated
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
            
            # Check authorization
            is_host = request.user.isHost
            is_event_host = is_host and task.event.host_id == request.user.id
            is_enrolled = request.user in task.event.volunteer_enrolled.all()
            is_assigned = request.user in task.volunteers.all()
            
            if not (is_host or is_enrolled or is_assigned):
                return JsonResponse({
                    'status': 'error',
                    'message': 'You do not have permission to view volunteers for this task'
                }, status=403)
            
            # Get all volunteers for the task
            volunteers = task.volunteers.all()
            
            # Prepare response data
            volunteers_data = []
            for volunteer in volunteers:
                volunteer_data = {
                    'id': volunteer.id,
                    'name': volunteer.name,
                    'skills': volunteer.skills,
                    'organization': volunteer.organization,
                    'location': volunteer.location,
                }
                
                # Check for skill match with task requirements
                if task.required_skills and volunteer.skills:
                    task_skills = set(s.strip().lower() for s in task.required_skills.split(',') if s.strip())
                    volunteer_skills = set(s.strip().lower() for s in volunteer.skills.split(',') if s.strip())
                    
                    matching_skills = task_skills.intersection(volunteer_skills)
                    volunteer_data['matching_skills'] = list(matching_skills)
                    volunteer_data['skill_match_percent'] = round(len(matching_skills) / len(task_skills) * 100 if task_skills else 0, 1)
                else:
                    volunteer_data['matching_skills'] = []
                    volunteer_data['skill_match_percent'] = 0
                
                # Only include contact info for event hosts
                if is_event_host:
                    volunteer_data.update({
                        'email': volunteer.email,
                        'contact': volunteer.contact,
                    })
                
                volunteers_data.append(volunteer_data)
            
            return JsonResponse({
                'status': 'success',
                'task_id': task.id,
                'task_name': task.task_name,
                'event_id': task.event.id,
                'event_name': task.event.event_name,
                'volunteers': volunteers_data,
                'total_count': len(volunteers_data)
            })
            
        except Exception as e:
            print(f"Error in TaskVolunteersView: {str(e)}")
            print(traceback.format_exc())
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            }, status=500)
    
    def post(self, request):
        # POST method can use the same logic as GET
        return self.get(request)


@method_decorator(csrf_exempt, name='dispatch')
class AvailableVolunteersForTaskView(View):
    """
    Get all enrolled volunteers who aren't assigned to a specific task
    Useful for assigning new volunteers to a task
    """
    def get(self, request):
        try:
            # Check if user is authenticated and is a host
            if not request.user.is_authenticated:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Authentication required'
                }, status=401)
            
            if not request.user.isHost:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Only hosts can view available volunteers'
                }, status=403)
            
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
            
            # Check if user is the host of the event
            if task.event.host_id != request.user.id:
                return JsonResponse({
                    'status': 'error',
                    'message': 'You are not the host of this event'
                }, status=403)
            
            # Get all volunteers enrolled in the event but not assigned to this task
            enrolled_volunteers = task.event.volunteer_enrolled.all()
            assigned_volunteers = task.volunteers.all()
            
            available_volunteers = enrolled_volunteers.exclude(id__in=[v.id for v in assigned_volunteers])
            
            # Prepare response data
            volunteers_data = []
            for volunteer in available_volunteers:
                # Calculate skill match if task has required skills
                skill_match_percent = 0
                matching_skills = []
                missing_skills = []
                
                if task.required_skills and volunteer.skills:
                    task_skills = set(s.strip().lower() for s in task.required_skills.split(',') if s.strip())
                    volunteer_skills = set(s.strip().lower() for s in volunteer.skills.split(',') if s.strip())
                    
                    matching_skills = list(task_skills.intersection(volunteer_skills))
                    missing_skills = list(task_skills - volunteer_skills)
                    
                    skill_match_percent = round(len(matching_skills) / len(task_skills) * 100 if task_skills else 0, 1)
                
                volunteer_data = {
                    'id': volunteer.id,
                    'name': volunteer.name,
                    'skills': volunteer.skills,
                    'organization': volunteer.organization,
                    'location': volunteer.location,
                    'email': volunteer.email,
                    'contact': volunteer.contact,
                    'matching_skills': matching_skills,
                    'missing_skills': missing_skills,
                    'skill_match_percent': skill_match_percent
                }
                
                volunteers_data.append(volunteer_data)
            
            # Sort by skill match percentage (highest first)
            volunteers_data.sort(key=lambda x: x['skill_match_percent'], reverse=True)
            
            return JsonResponse({
                'status': 'success',
                'task_id': task.id,
                'task_name': task.task_name,
                'event_id': task.event.id,
                'event_name': task.event.event_name,
                'available_volunteers': volunteers_data,
                'total_count': len(volunteers_data)
            })
            
        except Exception as e:
            print(f"Error in AvailableVolunteersForTaskView: {str(e)}")
            print(traceback.format_exc())
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            }, status=500)
    
    def post(self, request):
        # POST method can use the same logic as GET
        return self.get(request)


@method_decorator(csrf_exempt, name='dispatch')
class SearchVolunteersView(View):
    """
    Search for volunteers by name or skills
    This view is accessible only to hosts
    """
    def get(self, request):
        try:
            # Check if user is authenticated and is a host
            if not request.user.is_authenticated:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Authentication required'
                }, status=401)
            
            if not request.user.isHost:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Only hosts can search for volunteers'
                }, status=403)
            
            # Get search parameters
            query = request.GET.get('q', '').strip()
            event_id = request.GET.get('event_id', None)  # Optional: limit to a specific event
            
            # Build the base query
            volunteers_query = User.objects.filter(isHost=False)
            
            # Apply event filter if specified
            if event_id:
                try:
                    event = EventInfo.objects.get(id=event_id)
                    # Check if user is the host of the event
                    if event.host_id != request.user.id:
                        return JsonResponse({
                            'status': 'error',
                            'message': 'You are not the host of this event'
                        }, status=403)
                    volunteers_query = event.volunteer_enrolled.all()
                except EventInfo.DoesNotExist:
                    return JsonResponse({
                        'status': 'error',
                        'message': 'Event not found'
                    }, status=404)
            
            # Apply search query if provided
            if query:
                # Search by name or skills
                volunteers_query = volunteers_query.filter(
                    models.Q(name__icontains=query) | 
                    models.Q(skills__icontains=query) |
                    models.Q(organization__icontains=query) |
                    models.Q(location__icontains=query)
                )
            
            # Prepare response data
            volunteers_data = []
            for volunteer in volunteers_query:
                volunteer_data = {
                    'id': volunteer.id,
                    'name': volunteer.name,
                    'skills': volunteer.skills,
                    'organization': volunteer.organization,
                    'location': volunteer.location,
                    'email': volunteer.email,
                    'contact': volunteer.contact,
                }
                
                # If searching within an event, include event-specific info
                if event_id:
                    # Check if volunteer is assigned to any tasks in this event
                    assigned_tasks = TaskInfo.objects.filter(
                        event_id=event_id,
                        volunteers=volunteer
                    )
                    
                    volunteer_data['assigned_task_count'] = assigned_tasks.count()
                    if assigned_tasks.exists():
                        volunteer_data['assigned_tasks'] = [
                            {
                                'id': task.id,
                                'name': task.task_name,
                                'status': task.status
                            }
                            for task in assigned_tasks
                        ]
                
                volunteers_data.append(volunteer_data)
            
            return JsonResponse({
                'status': 'success',
                'query': query,
                'event_id': event_id,
                'volunteers': volunteers_data,
                'total_count': len(volunteers_data)
            })
            
        except Exception as e:
            print(f"Error in SearchVolunteersView: {str(e)}")
            print(traceback.format_exc())
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            }, status=500)
    
    def post(self, request):
        # POST method can use the same logic as GET
        return self.get(request)