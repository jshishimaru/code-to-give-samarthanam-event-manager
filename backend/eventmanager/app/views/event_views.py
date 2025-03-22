from rest_framework import viewsets
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from ..models import EventInfo, User, TaskInfo
from ..serializers.event import EventInfoSerializer
from ..serializers.task import TaskInfoSerializer
import json
from django.utils.dateparse import parse_datetime
from datetime import datetime
from django.utils import timezone
import traceback

class EventViewSet(viewsets.ModelViewSet):
    queryset = EventInfo.objects.all()
    serializer_class = EventInfoSerializer
    
    def get_permissions(self):
        # No specific permissions needed - we'll use session auth
        return []

    def create(self, request, *args, **kwargs):
        # Check if user is authenticated
        if not request.user.is_authenticated:
            return JsonResponse({
                'status': 'error',
                'message': 'Authentication required'
            }, status=401)
            
        # Use the authenticated user directly as the host
        if not request.user.isHost:
            return JsonResponse({
                'status': 'error',
                'message': 'Only hosts can create events'
            }, status=403)
            
        request.data['host'] = request.user.id
        return super().create(request, *args, **kwargs)


@method_decorator(csrf_exempt, name='dispatch')
class UserEnrolledEventsView(View):
    """
    Get events that the authenticated user is enrolled in (Upcoming or In Progress)
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
            
            # Check if user is a host (hosts don't enroll in events)
            if user.isHost:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Hosts do not enroll in events'
                }, status=400)
            
            # Get enrolled events
            events = user.enrolled_events.filter(status__in=['Upcoming', 'In Progress'])
            
            # Only get event IDs instead of full serialization
            event_ids = list(events.values_list('id', flat=True))
            
            return JsonResponse({
                'status': 'success',
                'count': len(event_ids),
                'event_ids': event_ids
            })
            
        except Exception as e:
            print(f"Error in UserEnrolledEventsView: {str(e)}")
            print(traceback.format_exc())
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            }, status=500)
    
    def post(self, request):
        # POST method can use the same logic as GET for this view
        return self.get(request)


@method_decorator(csrf_exempt, name='dispatch')
class UserPastEventsView(View):
    """
    Get past events that the authenticated user was enrolled in (Completed)
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
            
            # Check if user is a host (hosts don't enroll in events)
            if user.isHost:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Hosts do not enroll in events'
                }, status=400)
            
            # Get completed events the user was enrolled in
            events = user.enrolled_events.filter(status='Completed')
            
            # Only get event IDs instead of full serialization
            event_ids = list(events.values_list('id', flat=True))
            
            return JsonResponse({
                'status': 'success',
                'count': len(event_ids),
                'event_ids': event_ids
            })
            
        except Exception as e:
            print(f"Error in UserPastEventsView: {str(e)}")
            print(traceback.format_exc())
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            }, status=500)
    
    def post(self, request):
        # POST method can use the same logic as GET for this view
        return self.get(request)


@method_decorator(csrf_exempt, name='dispatch')
class UserUpcomingEventsView(View):
    """
    Get upcoming events that the authenticated user is enrolled in
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
            
            # Check if user is a host (hosts don't enroll in events)
            if user.isHost:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Hosts do not enroll in events'
                }, status=400)
            
            # Get upcoming events the user enrolled in
            events = user.enrolled_events.filter(status='Upcoming')
            
            # Only get event IDs instead of full serialization
            event_ids = list(events.values_list('id', flat=True))
            
            return JsonResponse({
                'status': 'success',
                'count': len(event_ids),
                'event_ids': event_ids
            })
            
        except Exception as e:
            print(f"Error in UserUpcomingEventsView: {str(e)}")
            print(traceback.format_exc())
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            }, status=500)
    
    def post(self, request):
        # POST method can use the same logic as GET for this view
        return self.get(request)


@method_decorator(csrf_exempt, name='dispatch')
class HostEventsView(View):
    """
    Get events created by the authenticated host
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
            
            # Check if user is a host
            if not user.isHost:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Only hosts can view their hosted events'
                }, status=403)
            
            # Get events created by this host
            events = EventInfo.objects.filter(host=user)
            
            # Only get event IDs instead of full serialization
            event_ids = list(events.values_list('id', flat=True))
            
            return JsonResponse({
                'status': 'success',
                'count': len(event_ids),
                'event_ids': event_ids
            })
            
        except Exception as e:
            print(f"Error in HostEventsView: {str(e)}")
            print(traceback.format_exc())
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            }, status=500)
    
    def post(self, request):
        # POST method can use the same logic as GET for this view
        return self.get(request)


@method_decorator(csrf_exempt, name='dispatch')
class AllUpcomingEventsView(View):
    """
    Get all upcoming events - accessible without authentication
    """
    def get(self, request):
        try:
            # Get all upcoming events
            events = EventInfo.objects.filter(status='Upcoming')
            
            # Only get event IDs instead of full serialization
            event_ids = list(events.values_list('id', flat=True))
            
            return JsonResponse({
                'status': 'success',
                'count': len(event_ids),
                'event_ids': event_ids
            })
            
        except Exception as e:
            print(f"Error in AllUpcomingEventsView: {str(e)}")
            print(traceback.format_exc())
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            }, status=500)
    
    def post(self, request):
        # POST method can use the same logic as GET for this view
        return self.get(request)


@method_decorator(csrf_exempt, name='dispatch')
class EventDetailsView(View):
    """
    Get details of a specific event using event_id from request data
    """
    def get(self, request):
        try:
            # Extract event_id from request data
            event_id = request.GET.get('event_id')
            
            if not event_id:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Event ID is required'
                }, status=400)
            
            # Get event details
            try:
                event = EventInfo.objects.get(id=event_id)
            except EventInfo.DoesNotExist:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Event not found'
                }, status=404)
                
            serializer = EventInfoSerializer(event, context={'request': request})
            
            return JsonResponse({
                'status': 'success',
                'event': serializer.data
            })
            
        except Exception as e:
            print(f"Error in EventDetailsView: {str(e)}")
            print(traceback.format_exc())
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            }, status=500)
    
    def post(self, request):
        try:
            # Extract event_id from POST data
            data = request.POST if request.POST else json.loads(request.body)
            event_id = data.get('event_id')
            
            if not event_id:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Event ID is required'
                }, status=400)
            
            # Get event details
            try:
                event = EventInfo.objects.get(id=event_id)
            except EventInfo.DoesNotExist:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Event not found'
                }, status=404)
                
            serializer = EventInfoSerializer(event, context={'request': request})
            
            return JsonResponse({
                'status': 'success',
                'event': serializer.data
            })
            
        except Exception as e:
            print(f"Error in EventDetailsView: {str(e)}")
            print(traceback.format_exc())
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            }, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class EnrollUserView(View):
    """
    Enroll the authenticated user in an event
    """
    def post(self, request):
        try:
            # Get the authenticated user
            user = request.user
            
            # Check if user is authenticated
            if not user.is_authenticated:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Authentication required'
                }, status=401)
            
            # Check if user is a volunteer (only volunteers can enroll in events)
            if user.isHost:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Hosts cannot enroll in events'
                }, status=403)
            
            # Extract data from request
            data = request.POST if request.POST else json.loads(request.body)
            event_id = data.get('event_id')
            
            # Validate input
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
            
            # Check if already enrolled
            if user in event.volunteer_enrolled.all():
                return JsonResponse({
                    'status': 'error',
                    'message': 'You are already enrolled in this event'
                }, status=400)
            
            # Check if event is full
            current_volunteers = event.volunteer_enrolled.count()
            if current_volunteers >= event.required_volunteers:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Event has reached maximum volunteer capacity'
                }, status=400)
            
            # Enroll user
            event.volunteer_enrolled.add(user)
            
            return JsonResponse({
                'status': 'success',
                'message': 'Successfully enrolled in event'
            })
            
        except Exception as e:
            print(f"Error in EnrollUserView: {str(e)}")
            print(traceback.format_exc())
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            }, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class UpdateEventView(View):
    """
    Update event details
    """
    def post(self, request):
        try:
            # Get the authenticated user
            user = request.user
            
            # Check if user is authenticated
            if not user.is_authenticated:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Authentication required'
                }, status=401)
            
            # Check if user is a host
            if not user.isHost:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Only hosts can update events'
                }, status=403)
            
            # Extract data from request
            data = request.POST.copy() if request.POST else json.loads(request.body)
            
            # Get event_id from request data
            event_id = data.get('event_id')
            
            if not event_id:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Event ID is required'
                }, status=400)
            
            try:
                event = EventInfo.objects.get(id=event_id)
            except EventInfo.DoesNotExist:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Event not found'
                }, status=404)
            
            # Check if the authenticated user is the host of this event
            if event.host.id != user.id:
                return JsonResponse({
                    'status': 'error',
                    'message': 'You can only update events you have created'
                }, status=403)
            
            # Update event fields if provided
            if 'event_name' in data:
                event.event_name = data.get('event_name')
            
            if 'overview' in data:
                event.overview = data.get('overview')
            
            if 'description' in data:
                event.description = data.get('description')
            
            # Parse datetime strings for start_time and end_time
            if 'start_time' in data:
                start_time_str = data.get('start_time')
                try:
                    start_time = parse_datetime(start_time_str)
                    if not start_time:
                        # Try alternative parsing
                        start_time = datetime.fromisoformat(start_time_str.replace('Z', '+00:00'))
                    
                    # Ensure time is timezone-aware
                    if timezone.is_naive(start_time):
                        start_time = timezone.make_aware(start_time)
                    
                    event.start_time = start_time
                except (ValueError, TypeError):
                    return JsonResponse({
                        'status': 'error',
                        'message': 'Invalid start_time format. Use ISO format (YYYY-MM-DDTHH:MM:SSZ)'
                    }, status=400)
            
            if 'end_time' in data:
                end_time_str = data.get('end_time')
                try:
                    end_time = parse_datetime(end_time_str)
                    if not end_time:
                        # Try alternative parsing
                        end_time = datetime.fromisoformat(end_time_str.replace('Z', '+00:00'))
                    
                    # Ensure time is timezone-aware
                    if timezone.is_naive(end_time):
                        end_time = timezone.make_aware(end_time)
                    
                    event.end_time = end_time
                except (ValueError, TypeError):
                    return JsonResponse({
                        'status': 'error',
                        'message': 'Invalid end_time format. Use ISO format (YYYY-MM-DDTHH:MM:SSZ)'
                    }, status=400)
            
            if 'required_volunteers' in data:
                event.required_volunteers = int(data.get('required_volunteers'))
            
            if 'status' in data:
                # Validate status
                status_value = data.get('status')
                valid_statuses = [choice[0] for choice in EventInfo.STATUS_CHOICES]
                if status_value in valid_statuses:
                    event.status = status_value
                else:
                    return JsonResponse({
                        'status': 'error',
                        'message': f'Invalid status. Valid options are: {", ".join(valid_statuses)}'
                    }, status=400)
            
            if 'volunteer_efficiency' in data:
                event.volunteer_efficiency = float(data.get('volunteer_efficiency'))
            
            if 'task_analysis' in data:
                event.task_analysis = data.get('task_analysis')
            
            if 'location' in data:
                event.location = data.get('location')
            
            # Handle image update
            if 'image' in request.FILES:
                event.image = request.FILES['image']
            
            # Save the updated event
            event.save()
            
            # Return updated event data
            serializer = EventInfoSerializer(event, context={'request': request})
            return JsonResponse({
                'status': 'success',
                'message': 'Event updated successfully',
                'event': serializer.data
            })
            
        except Exception as e:
            print(f"Error in UpdateEventView: {str(e)}")
            print(traceback.format_exc())
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            }, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class CreateEventView(View):
    """
    Create a new event with the authenticated user as host
    """
    def post(self, request):
        try:
            # Get the authenticated user
            user = request.user
            
            # Check if user is authenticated
            if not user.is_authenticated:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Authentication required'
                }, status=401)
            
            # Check if user is a host
            if not user.isHost:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Only hosts can create events'
                }, status=403)
            
            # Extract data from request
            data = request.POST.copy() if request.POST else json.loads(request.body)
            
            # Get required fields
            event_name = data.get('event_name')
            overview = data.get('overview', '')
            description = data.get('description', '')
            
            # Parse datetime strings to datetime objects
            start_time_str = data.get('start_time')
            end_time_str = data.get('end_time')
            
            if not start_time_str or not end_time_str:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Start time and end time are required'
                }, status=400)
            
            # Parse the datetime strings
            try:
                start_time = parse_datetime(start_time_str)
                if not start_time:
                    # If Django's parser fails, try a direct conversion
                    start_time = datetime.fromisoformat(start_time_str.replace('Z', '+00:00'))
            except (ValueError, TypeError):
                return JsonResponse({
                    'status': 'error',
                    'message': 'Invalid start_time format. Use ISO format (YYYY-MM-DDTHH:MM:SSZ)'
                }, status=400)
                
            try:
                end_time = parse_datetime(end_time_str)
                if not end_time:
                    # If Django's parser fails, try a direct conversion
                    end_time = datetime.fromisoformat(end_time_str.replace('Z', '+00:00'))
            except (ValueError, TypeError):
                return JsonResponse({
                    'status': 'error',
                    'message': 'Invalid end_time format. Use ISO format (YYYY-MM-DDTHH:MM:SSZ)'
                }, status=400)
            
            # Ensure times are timezone-aware
            if timezone.is_naive(start_time):
                start_time = timezone.make_aware(start_time)
            if timezone.is_naive(end_time):
                end_time = timezone.make_aware(end_time)
            
            required_volunteers = int(data.get('required_volunteers', 1))
            
            # Validate required fields
            if not event_name:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Event name is required'
                }, status=400)
            
            # Create the event with the authenticated user as host
            event = EventInfo.objects.create(
                event_name=event_name,
                overview=overview,
                description=description,
                start_time=start_time,
                end_time=end_time,
                host=user,  # Use the authenticated user
                required_volunteers=required_volunteers,
                status=data.get('status', 'Draft'),
                volunteer_efficiency=float(data.get('volunteer_efficiency', 0.0)),
                task_analysis=data.get('task_analysis', ''),
                location=data.get('location', '')
            )
            
            # Handle image if provided
            if 'image' in request.FILES:
                event.image = request.FILES['image']
                event.save()
            
            # Return the created event
            serializer = EventInfoSerializer(event, context={'request': request})
            return JsonResponse({
                'status': 'success',
                'message': 'Event created successfully',
                'event': serializer.data
            }, status=201)
            
        except Exception as e:
            print(f"Error in CreateEventView: {str(e)}")
            print(traceback.format_exc())
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            }, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class UnenrollUserView(View):
    """
    Unenroll the authenticated user from an event
    """
    def post(self, request):
        try:
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
                    'message': 'Hosts cannot unenroll from events'
                }, status=403)
            
            # Extract data from request
            data = request.POST if request.POST else json.loads(request.body)
            event_id = data.get('event_id')
            
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
            
            # Check if user is enrolled
            if user not in event.volunteer_enrolled.all():
                return JsonResponse({
                    'status': 'error',
                    'message': 'You are not enrolled in this event'
                }, status=400)
            
            # Check if event is already in progress or completed
            if event.status in ['In Progress', 'Completed']:
                return JsonResponse({
                    'status': 'error',
                    'message': f'Cannot unenroll from {event.status.lower()} events'
                }, status=400)
            
            # Unenroll user
            event.volunteer_enrolled.remove(user)
            
            return JsonResponse({
                'status': 'success',
                'message': 'Successfully unenrolled from event'
            })
            
        except Exception as e:
            print(f"Error in UnenrollUserView: {str(e)}")
            print(traceback.format_exc())
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            }, status=500)