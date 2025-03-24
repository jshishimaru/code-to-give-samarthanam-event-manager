from rest_framework import viewsets
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from ..models import EventInfo, User, TaskInfo
from ..serializers.event import EventInfoSerializer
from ..serializers.task import TaskInfoSerializer
import json
import traceback
import pandas as pd
from django.db.models import Count ,Q
from django.utils import timezone

# Try importing the ML modules
try:
    from app.ml.event_recommendation_for_volunteers import (
        recommend_events_for_volunteer, 
        match_tasks_to_volunteers, 
        extract_event_skills
    )
    ML_IMPORT_SUCCESS = True
except ImportError as e:
    print(f"Error importing ML modules: {str(e)}")
    ML_IMPORT_SUCCESS = False


@method_decorator(csrf_exempt, name='dispatch')
class RecommendEventsForVolunteerView(View):
    """
    Get personalized event recommendations for a volunteer based on their skills
    """
    def get(self, request):
        try:
            # Check if ML modules were imported successfully
            if not ML_IMPORT_SUCCESS:
                return JsonResponse({
                    'status': 'error',
                    'message': 'ML modules not available. Check server logs for details.'
                }, status=500)
                
            # Get the authenticated user
            user = request.user
            
            # Check if user is authenticated
            if not user.is_authenticated:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Authentication required'
                }, status=401)
            
            # Check if user is a volunteer
            if user.isHost:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Recommendations are only available for volunteers'
                }, status=400)
            
            # Get optional filter parameters
            status_filter = request.GET.get('status', 'Upcoming')  # Default to upcoming events
            limit = int(request.GET.get('limit', 10))  # Default to 10 recommendations
            include_enrolled = request.GET.get('include_enrolled', 'false').lower() == 'true'
            
            # Get available events
            events_query = EventInfo.objects.filter(status=status_filter)
            
            # Exclude events the user is already enrolled in unless include_enrolled is true
            if not include_enrolled:
                events_query = events_query.exclude(volunteer_enrolled=user)
            
            # Order by start_time to get the nearest events first
            events = events_query.order_by('start_time')
            
            # Prepare event data for the ML recommendation
            events_data = []
            for event in events:
                # Get tasks for this event
                tasks = TaskInfo.objects.filter(event=event)
                tasks_data = []
                
                for task in tasks:
                    tasks_data.append({
                        'id': task.id,
                        'name': task.task_name,
                        'description': task.description,
                        'required_skills': task.required_skills
                    })
                
                events_data.append({
                    'id': event.id,
                    'name': event.event_name,
                    'description': event.description,
                    'overview': event.overview,
                    'tasks': tasks_data,
                    'start_time': event.start_time.isoformat(),
                    'end_time': event.end_time.isoformat(),
                    'location': event.location,
                    'status': event.status,
                    'enrolled': user in event.volunteer_enrolled.all(),
                })
            
            # If user has no skills defined, return events sorted by start time
            if not user.skills:
                # Include a message in the response about missing skills
                return JsonResponse({
                    'status': 'success',
                    'message': 'Your profile has no skills defined. Please update your profile to get personalized recommendations.',
                    'recommendations': events_data[:limit],
                    'count': len(events_data[:limit]),
                    'personalized': False
                })
            
            # Get personalized recommendations
            recommended_events = recommend_events_for_volunteer(user.skills, events_data)
            
            # Apply limit
            recommended_events = recommended_events[:limit]
            
            # Format the response
            for event in recommended_events:
                # Extract the most relevant skills for this event based on the tasks
                event['extracted_skills'] = extract_event_skills(event)
                
                # Add additional fields 
                event['volunteer_count'] = EventInfo.objects.get(id=event['id']).volunteer_enrolled.count()
                event['task_count'] = TaskInfo.objects.filter(event_id=event['id']).count()
                
                # Format the relevance score for better readability
                event['relevance_score'] = round(event['relevance_score'] * 100, 1)  # Convert to percentage
            
            return JsonResponse({
                'status': 'success',
                'user_skills': user.skills.split(',') if user.skills else [],
                'recommendations': recommended_events,
                'count': len(recommended_events),
                'personalized': True
            })
            
        except Exception as e:
            print(f"Error in RecommendEventsForVolunteerView: {str(e)}")
            print(traceback.format_exc())
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            }, status=500)
    
    def post(self, request):
        # POST method can use the same logic as GET for this view
        return self.get(request)


@method_decorator(csrf_exempt, name='dispatch')
class GetRecommendedTasksForUserView(View):
    """
    Get personalized task recommendations for a volunteer based on their skills
    """
    def get(self, request):
        try:
            # Check if ML modules were imported successfully
            if not ML_IMPORT_SUCCESS:
                return JsonResponse({
                    'status': 'error',
                    'message': 'ML modules not available. Check server logs for details.'
                }, status=500)
                
            # Get the authenticated user
            user = request.user
            
            # Check if user is authenticated
            if not user.is_authenticated:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Authentication required'
                }, status=401)
            
            # Check if user is a volunteer
            if user.isHost:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Task recommendations are only available for volunteers'
                }, status=400)
            
            # Get optional filter parameters
            event_id = request.GET.get('event_id')  # Optional event filter
            limit = int(request.GET.get('limit', 10))  # Default to 10 recommendations
            
            # Build the task query
            tasks_query = TaskInfo.objects.filter(status__in=['Pending', 'In Progress'])
            
            # If event_id is provided, filter by event
            if event_id:
                tasks_query = tasks_query.filter(event_id=event_id)
            else:
                # Otherwise, only include tasks from events the user is enrolled in
                enrolled_events = user.enrolled_events.all()
                tasks_query = tasks_query.filter(event__in=enrolled_events)
            
            # Exclude tasks the user is already assigned to
            tasks_query = tasks_query.exclude(volunteers=user)
            
            # Prepare task data for ML recommendation
            tasks_data = []
            for task in tasks_query:
                task_context = f"{task.task_name}. {task.description}"
                if task.required_skills:
                    task_context += f" Skills: {task.required_skills}"
                
                tasks_data.append({
                    'id': task.id,
                    'name': task.task_name,
                    'description': task.description,
                    'context': task_context,
                    'required_skills': task.required_skills,
                    'event_id': task.event.id,
                    'event_name': task.event.event_name,
                    'start_time': task.start_time.isoformat(),
                    'end_time': task.end_time.isoformat(),
                    'status': task.status
                })
            
            # If user has no skills defined, return tasks sorted by start time
            if not user.skills:
                # Sort by start time
                tasks_data.sort(key=lambda x: x['start_time'])
                
                return JsonResponse({
                    'status': 'success',
                    'message': 'Your profile has no skills defined. Please update your profile to get personalized recommendations.',
                    'tasks': tasks_data[:limit],
                    'count': len(tasks_data[:limit]),
                    'personalized': False
                })
                
            # If no tasks found, return empty response
            if not tasks_data:
                return JsonResponse({
                    'status': 'success',
                    'message': 'No available tasks found for recommendation.',
                    'tasks': [],
                    'count': 0,
                    'personalized': False
                })
            
            # Use the ML module to match tasks to the user
            volunteer_df = pd.DataFrame([{
                'Name': user.name,
                'Skills': user.skills,
                'ID': user.id,
                'Email': user.email
            }])
            
            task_contexts = [task['context'] for task in tasks_data]
            
            # Use the matching function to get tasks ranked by relevance
            volunteer_task_map = match_tasks_to_volunteers(task_contexts, volunteer_df)
            
            # Get the ranked tasks for this volunteer
            if user.name in volunteer_task_map:
                ranked_contexts = volunteer_task_map[user.name]
                
                # Reorder tasks based on the ranking
                ranked_tasks = []
                for context in ranked_contexts:
                    # Find the task with this context
                    for task in tasks_data:
                        if task['context'] == context:
                            # Calculate match score between user skills and task skills
                            user_skills = set(s.strip().lower() for s in user.skills.split(',') if s.strip())
                            task_skills = set()
                            if task['required_skills']:
                                task_skills = set(s.strip().lower() for s in task['required_skills'].split(',') if s.strip())
                            
                            matching_skills = list(user_skills.intersection(task_skills))
                            match_score = round((len(matching_skills) / len(task_skills) * 100) if task_skills else 0, 1)
                            
                            # Add match information to the task
                            task_copy = task.copy()
                            task_copy['match_score'] = match_score
                            task_copy['matching_skills'] = matching_skills
                            task_copy['missing_skills'] = list(task_skills - user_skills)
                            
                            ranked_tasks.append(task_copy)
                            break
                
                # Apply limit
                ranked_tasks = ranked_tasks[:limit]
                
                return JsonResponse({
                    'status': 'success',
                    'user_skills': user.skills.split(',') if user.skills else [],
                    'tasks': ranked_tasks,
                    'count': len(ranked_tasks),
                    'personalized': True
                })
            else:
                # Fallback - return tasks sorted by start time
                tasks_data.sort(key=lambda x: x['start_time'])
                
                return JsonResponse({
                    'status': 'success',
                    'message': 'Could not generate recommendations. Using default sorting.',
                    'tasks': tasks_data[:limit],
                    'count': len(tasks_data[:limit]),
                    'personalized': False
                })
            
        except Exception as e:
            print(f"Error in GetRecommendedTasksForUserView: {str(e)}")
            print(traceback.format_exc())
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            }, status=500)
    
    def post(self, request):
        # POST method can use the same logic as GET for this view
        return self.get(request)


@method_decorator(csrf_exempt, name='dispatch')
class AnalyzeEventSkillsView(View):
    """
    Analyze the skills required for an event based on its tasks
    """
    def get(self, request):
        try:
            # Check if ML modules were imported successfully
            if not ML_IMPORT_SUCCESS:
                return JsonResponse({
                    'status': 'error',
                    'message': 'ML modules not available. Check server logs for details.'
                }, status=500)
                
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
            
            # Get tasks for this event
            tasks = TaskInfo.objects.filter(event=event)
            
            # Prepare event data for skill analysis
            event_data = {
                'id': event.id,
                'name': event.event_name,
                'description': event.description,
                'overview': event.overview,
                'tasks': []
            }
            
            # Collect all explicit skills from tasks
            all_skills = set()
            skill_counts = {}
            
            for task in tasks:
                task_data = {
                    'id': task.id,
                    'name': task.task_name,
                    'description': task.description,
                    'required_skills': task.required_skills,
                    'skills_list': task.get_skills_list() if hasattr(task, 'get_skills_list') else []
                }
                event_data['tasks'].append(task_data)
                
                # Add to skill counts
                skills_list = task_data['skills_list']
                if not skills_list and task.required_skills:
                    # If there's no get_skills_list method, extract from required_skills directly
                    skills_list = [s.strip() for s in task.required_skills.split(',') if s.strip()]
                    
                for skill in skills_list:
                    skill = skill.strip().lower()
                    all_skills.add(skill)
                    skill_counts[skill] = skill_counts.get(skill, 0) + 1
            
            # Extract skills from the event if none are explicitly defined in tasks
            extracted_skills = []
            if not all_skills:
                extracted_skills = extract_event_skills(event_data)
                for skill in extracted_skills:
                    skill = skill.strip().lower()
                    all_skills.add(skill)
                    skill_counts[skill] = skill_counts.get(skill, 0) + 1
            
            # Prepare the skill statistics
            skill_stats = []
            for skill in all_skills:
                stat = {
                    'skill': skill,
                    'count': skill_counts.get(skill, 0),
                    'percentage': round(skill_counts.get(skill, 0) / len(tasks) * 100 if tasks else 0, 1)
                }
                skill_stats.append(stat)
            
            # Sort by frequency
            skill_stats.sort(key=lambda x: x['count'], reverse=True)
            
            # Count how many volunteers enrolled have each skill
            volunteer_skill_counts = {}
            enrolled_volunteers = event.volunteer_enrolled.all()
            
            for skill in all_skills:
                # Count volunteers with this skill
                volunteer_skill_counts[skill] = sum(
                    1 for v in enrolled_volunteers if v.skills and
                    skill.lower() in [s.strip().lower() for s in v.skills.split(',') if s.strip()]
                )
            
            # Identify skill gaps
            skill_gaps = []
            for skill in all_skills:
                required_count = skill_counts.get(skill, 0)
                available_count = volunteer_skill_counts.get(skill, 0)
                
                gap = required_count - available_count
                if gap > 0:
                    skill_gaps.append({
                        'skill': skill,
                        'required': required_count,
                        'available': available_count,
                        'gap': gap
                    })
            
            # Sort gaps by severity
            skill_gaps.sort(key=lambda x: x['gap'], reverse=True)
            
            # Analyze overall coverage
            total_skill_requirements = sum(skill_counts.values())
            total_skill_coverage = sum(min(skill_counts.get(skill, 0), volunteer_skill_counts.get(skill, 0)) for skill in all_skills)
            
            coverage_percentage = round(total_skill_coverage / total_skill_requirements * 100 if total_skill_requirements else 0, 1)
            
            return JsonResponse({
                'status': 'success',
                'event_id': event.id,
                'event_name': event.event_name,
                'skills': list(all_skills),
                'skill_stats': skill_stats,
                'volunteer_skill_counts': volunteer_skill_counts,
                'skill_gaps': skill_gaps,
                'coverage_percentage': coverage_percentage,
                'extracted_skills': extracted_skills if extracted_skills else [],
                'is_ml_extracted': bool(extracted_skills),
                'total_tasks': len(tasks),
                'total_volunteers': enrolled_volunteers.count()
            })
            
        except Exception as e:
            print(f"Error in AnalyzeEventSkillsView: {str(e)}")
            print(traceback.format_exc())
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            }, status=500)
    
    def post(self, request):
        # POST method can use the same logic as GET for this view
        return self.get(request)

@method_decorator(csrf_exempt, name='dispatch')
class GetSortedEventsByRelevanceView(View):
    """
    Get events sorted by relevance to the current user based on skills
    Always returns all ongoing and upcoming events, sorted by relevance when possible
    """
    def get(self, request):
        try:
            # Get the authenticated user
            user = request.user
            
            # Check if user is authenticated
            if not user.is_authenticated:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Authentication required'
                }, status=401)
            
            # Get optional filter parameters
            status = request.GET.get('status', 'active')  # Default to active events (ongoing + upcoming)
            limit = int(request.GET.get('limit', 100))  # Default to 100 events
            include_past = request.GET.get('include_past', 'false').lower() == 'true'
            
            # Build event query based on status parameter
            if status == 'all':
                events_query = EventInfo.objects.all()
            elif status == 'active':
                # Get ongoing and upcoming events
                from django.utils import timezone
                now = timezone.now()
                events_query = EventInfo.objects.filter(
                    (Q(status='Ongoing') | Q(status='Upcoming')) &
                    (Q(end_time__gte=now) | Q(start_time__gte=now))
                )
            elif status == 'ongoing':
                events_query = EventInfo.objects.filter(status='Ongoing')
            elif status == 'upcoming':
                events_query = EventInfo.objects.filter(status='Upcoming')
            else:
                # Specific status
                events_query = EventInfo.objects.filter(status=status)
            
            # By default, exclude past events unless explicitly requested
            if not include_past:
                from django.utils import timezone
                now = timezone.now()
                events_query = events_query.filter(end_time__gte=now)
            
            # Order by start_time (default ordering)
            events = events_query.order_by('start_time')
            
            # Prepare event data
            events_data = []
            for event in events:
                # Get tasks for this event
                tasks = TaskInfo.objects.filter(event=event)
                tasks_data = []
                
                # Get all tasks data
                for task in tasks:
                    tasks_data.append({
                        'id': task.id,
                        'name': task.task_name,
                        'description': task.description,
                        'required_skills': task.required_skills
                    })
                
                # Create event data object
                event_data = {
                    'id': event.id,
                    'name': event.event_name,
                    'description': event.description,
                    'overview': event.overview,
                    'tasks': tasks_data,
                    'start_time': event.start_time.isoformat(),
                    'end_time': event.end_time.isoformat(),
                    'location': event.location,
                    'status': event.status,
                    'enrolled': user in event.volunteer_enrolled.all(),
                    'volunteer_count': event.volunteer_enrolled.count(),
                    'task_count': tasks.count()
                }
                
                events_data.append(event_data)
            
            # If ML modules aren't available or user has no skills, 
            # still return events but sorted by start_time
            if not ML_IMPORT_SUCCESS or not user.skills:
                return JsonResponse({
                    'status': 'success',
                    'message': 'Events sorted by start time' + 
                               (' (ML modules not available)' if not ML_IMPORT_SUCCESS else 
                                ' (no user skills defined)' if not user.skills else ''),
                    'events': events_data[:limit],
                    'count': len(events_data[:limit]),
                    'personalized': False,
                    'total_available': len(events_data)
                })
            
            # If we have events and ML is available, get personalized recommendations
            if events_data:
                try:
                    recommended_events = recommend_events_for_volunteer(user.skills, events_data)
                    
                    # Format the response
                    for event in recommended_events:
                        # Extract the most relevant skills for this event based on the tasks
                        event['extracted_skills'] = extract_event_skills(event)
                        
                        # Format the relevance score for better readability
                        event['relevance_score'] = round(event['relevance_score'] * 100, 1)  # Convert to percentage
                        
                        # Calculate skill match percentage
                        if event['extracted_skills']:
                            user_skills = set(s.strip().lower() for s in user.skills.split(',') if s.strip())
                            event_skills = set(s.strip().lower() for s in event['extracted_skills'])
                            
                            matching_skills = user_skills.intersection(event_skills)
                            event['matching_skills'] = list(matching_skills)
                            event['skill_match_percent'] = round(len(matching_skills) / len(event_skills) * 100 if event_skills else 0, 1)
                        else:
                            event['matching_skills'] = []
                            event['skill_match_percent'] = 0
                    
                    # Apply limit
                    limited_events = recommended_events[:limit]
                    
                    return JsonResponse({
                        'status': 'success',
                        'user_skills': user.skills.split(',') if user.skills else [],
                        'events': limited_events,
                        'count': len(limited_events),
                        'personalized': True,
                        'total_available': len(recommended_events)
                    })
                except Exception as e:
                    # If recommendation fails, fall back to chronological ordering
                    print(f"Warning: Event recommendation failed: {str(e)}")
                    print(traceback.format_exc())
                    
                    return JsonResponse({
                        'status': 'success',
                        'message': f'Events sorted by start time (recommendation error: {str(e)})',
                        'events': events_data[:limit],
                        'count': len(events_data[:limit]),
                        'personalized': False,
                        'total_available': len(events_data)
                    })
            else:
                # No events found
                return JsonResponse({
                    'status': 'success',
                    'message': 'No events found matching the specified criteria',
                    'events': [],
                    'count': 0,
                    'personalized': False,
                    'total_available': 0
                })
            
        except Exception as e:
            print(f"Error in GetSortedEventsByRelevanceView: {str(e)}")
            print(traceback.format_exc())
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            }, status=500)
    
    def post(self, request):
        # POST method can use the same logic as GET for this view
        return self.get(request)