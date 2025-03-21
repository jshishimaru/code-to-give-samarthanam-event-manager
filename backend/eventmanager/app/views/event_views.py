from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action, api_view
from django.views.decorators.csrf import csrf_exempt
from ..models import EventInfo, User, TaskInfo
from ..serializers.event import EventInfoSerializer
from ..serializers.task import TaskInfoSerializer
import json
from django.http import JsonResponse
from django.utils.dateparse import parse_datetime  # Add this import
from datetime import datetime
from django.utils import timezone

class EventViewSet(viewsets.ModelViewSet):
    queryset = EventInfo.objects.all()
    serializer_class = EventInfoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        request.data['host'] = request.user.id
        return super().create(request, *args, **kwargs)


@csrf_exempt
@api_view(['GET', 'POST'])
def user_enrolled_events(request):
    try:
        if request.method == 'GET':
            user_id = request.GET.get('user_id')
        else:  # POST
            user_id = request.data.get('user_id')
        
        if not user_id:
            return Response({
                'status': 'error',
                'message': 'User ID is required'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        user = User.objects.get(id=user_id)
        
        events = user.enrolled_events.filter(status='Upcoming' or 'In Progress')
        
        serializer = EventInfoSerializer(events, many=True)
        
        return Response({
            'status': 'success',
            'count': events.count(),
            'events': serializer.data
        })
        
    except User.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'User not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@csrf_exempt
@api_view(['GET', 'POST'])
def user_past_events(request):
    try:
        if request.method == 'GET':
            user_id = request.GET.get('user_id')
        else:  # POST
            user_id = request.data.get('user_id')
        
        if not user_id:
            return Response({
                'status': 'error',
                'message': 'User ID is required'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        user = User.objects.get(id=user_id)
        
        events = user.enrolled_events.filter(status='Completed')
        
        serializer = EventInfoSerializer(events, many=True)
        
        return Response({
            'status': 'success',
            'count': events.count(),
            'events': serializer.data
        })
        
    except User.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'User not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@csrf_exempt
@api_view(['GET', 'POST'])
def user_upcoming_events(request):
    try:
        if request.method == 'GET':
            user_id = request.GET.get('user_id')
        else:  # POST
            user_id = request.data.get('user_id')
        
        if not user_id:
            return Response({
                'status': 'error',
                'message': 'User ID is required'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        # Get the user
        user = User.objects.get(id=user_id)
        
        # Get upcoming events the user enrolled in
        events = user.enrolled_events.filter(status='Upcoming')
        
        # Serialize the events
        serializer = EventInfoSerializer(events, many=True)
        
        return Response({
            'status': 'success',
            'count': events.count(),
            'events': serializer.data
        })
        
    except User.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'User not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
  
@csrf_exempt
@api_view(['GET', 'POST'])
def all_upcoming_events(request):
    try:
        # Get all upcoming events
        events = EventInfo.objects.filter(status='Upcoming')
        
        # Serialize the events
        serializer = EventInfoSerializer(events, many=True)
        
        return Response({
            'status': 'success',
            'count': events.count(),
            'events': serializer.data
        })
        
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@csrf_exempt
@api_view(['GET', 'POST'])
def get_event_details(request):
    """
    Get details of a specific event using event_id from request data
    """
    try:
        # Extract event_id from request
        if request.method == 'GET':
            event_id = request.GET.get('event_id')
        else:  # POST
            event_id = request.data.get('event_id')
        
        if not event_id:
            return Response({
                'status': 'error',
                'message': 'Event ID is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get event details
        event = EventInfo.objects.get(id=event_id)
        serializer = EventInfoSerializer(event)
        
        return Response({
            'status': 'success',
            'event': serializer.data
        })
        
    except EventInfo.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Event not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@csrf_exempt
@api_view(['POST'])
def enroll_user_in_event(request):
    """
    Enroll a user in an event using event_id and user_id from request data
    """
    try:
        # Extract data from request
        event_id = request.data.get('event_id')
        user_id = request.data.get('user_id')
        
        # Validate input
        if not event_id:
            return Response({
                'status': 'error',
                'message': 'Event ID is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not user_id:
            return Response({
                'status': 'error',
                'message': 'User ID is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get objects
        try:
            event = EventInfo.objects.get(id=event_id)
        except EventInfo.DoesNotExist:
            return Response({
                'status': 'error',
                'message': 'Event not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({
                'status': 'error',
                'message': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Check if already enrolled
        if user in event.volunteer_enrolled.all():
            return Response({
                'status': 'error',
                'message': 'User already enrolled in this event'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if event is full
        current_volunteers = event.volunteer_enrolled.count()
        if current_volunteers >= event.required_volunteers:
            return Response({
                'status': 'error',
                'message': 'Event has reached maximum volunteer capacity'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Enroll user
        event.volunteer_enrolled.add(user)
        
        return Response({
            'status': 'success',
            'message': 'User successfully enrolled in event'
        })
        
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@csrf_exempt
@api_view(['POST'])
def update_event(request):
    """
    Update event details including adding/updating image and changing status
    """
    try:
        # Extract event_id from request
        event_id = request.data.get('event_id')
        
        if not event_id:
            return Response({
                'status': 'error',
                'message': 'Event ID is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            event = EventInfo.objects.get(id=event_id)
        except EventInfo.DoesNotExist:
            return Response({
                'status': 'error',
                'message': 'Event not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Update event fields if provided
        if 'event_name' in request.data:
            event.event_name = request.data.get('event_name')
        
        if 'overview' in request.data:
            event.overview = request.data.get('overview')
        
        if 'description' in request.data:
            event.description = request.data.get('description')
        
        # Parse datetime strings for start_time and end_time
        if 'start_time' in request.data:
            start_time_str = request.data.get('start_time')
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
                return Response({
                    'status': 'error',
                    'message': 'Invalid start_time format. Use ISO format (YYYY-MM-DDTHH:MM:SSZ)'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        if 'end_time' in request.data:
            end_time_str = request.data.get('end_time')
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
                return Response({
                    'status': 'error',
                    'message': 'Invalid end_time format. Use ISO format (YYYY-MM-DDTHH:MM:SSZ)'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        if 'required_volunteers' in request.data:
            event.required_volunteers = int(request.data.get('required_volunteers'))
        
        if 'status' in request.data:
            # Validate status
            status_value = request.data.get('status')
            valid_statuses = [choice[0] for choice in EventInfo.STATUS_CHOICES]
            if status_value in valid_statuses:
                event.status = status_value
            else:
                return Response({
                    'status': 'error',
                    'message': f'Invalid status. Valid options are: {", ".join(valid_statuses)}'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        if 'volunteer_efficiency' in request.data:
            event.volunteer_efficiency = float(request.data.get('volunteer_efficiency'))
        
        if 'task_analysis' in request.data:
            event.task_analysis = request.data.get('task_analysis')
        
        if 'location' in request.data:
            event.location = request.data.get('location')
        
        # Handle image update
        if 'image' in request.FILES:
            event.image = request.FILES['image']
        
        # Save the updated event
        event.save()
        
        # Return updated event data
        serializer = EventInfoSerializer(event)
        return Response({
            'status': 'success',
            'message': 'Event updated successfully',
            'event': serializer.data
        })
        
    except Exception as e:
        import traceback
        print(f"Error updating event: {str(e)}")
        print(traceback.format_exc())
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@csrf_exempt
@api_view(['POST'])
def create_event(request):
    """
    Create a new event with data from the request
    """
    try:
        # Extract host_id from request
        host_id = request.data.get('host_id')
        
        if not host_id:
            return Response({
                'status': 'error',
                'message': 'Host ID is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify the host exists
        try:
            from ..models import Host
            host = Host.objects.get(id=host_id)
        except Host.DoesNotExist:
            return Response({
                'status': 'error',
                'message': 'Host not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Get required fields
        event_name = request.data.get('event_name')
        overview = request.data.get('overview', '')
        description = request.data.get('description', '')
        
        # Parse datetime strings to datetime objects
        start_time_str = request.data.get('start_time')
        end_time_str = request.data.get('end_time')
        
        if not start_time_str or not end_time_str:
            return Response({
                'status': 'error',
                'message': 'Start time and end time are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Parse the datetime strings
        try:
            start_time = parse_datetime(start_time_str)
            if not start_time:
                # If Django's parser fails, try a direct conversion
                start_time = datetime.fromisoformat(start_time_str.replace('Z', '+00:00'))
        except (ValueError, TypeError):
            return Response({
                'status': 'error',
                'message': 'Invalid start_time format. Use ISO format (YYYY-MM-DDTHH:MM:SSZ)'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            end_time = parse_datetime(end_time_str)
            if not end_time:
                # If Django's parser fails, try a direct conversion
                end_time = datetime.fromisoformat(end_time_str.replace('Z', '+00:00'))
        except (ValueError, TypeError):
            return Response({
                'status': 'error',
                'message': 'Invalid end_time format. Use ISO format (YYYY-MM-DDTHH:MM:SSZ)'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Ensure times are timezone-aware
        if timezone.is_naive(start_time):
            start_time = timezone.make_aware(start_time)
        if timezone.is_naive(end_time):
            end_time = timezone.make_aware(end_time)
        
        required_volunteers = int(request.data.get('required_volunteers', 1))
        
        # Validate required fields
        if not event_name:
            return Response({
                'status': 'error',
                'message': 'Event name is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create the event directly
        from ..models import EventInfo
        event = EventInfo.objects.create(
            event_name=event_name,
            overview=overview,
            description=description,
            start_time=start_time,  # Now using datetime object
            end_time=end_time,      # Now using datetime object
            host=host,              # Directly use the host object
            required_volunteers=required_volunteers,
            status=request.data.get('status', 'Draft'),
            volunteer_efficiency=float(request.data.get('volunteer_efficiency', 0.0)),
            task_analysis=request.data.get('task_analysis', ''),
            location=request.data.get('location', '')
        )
        
        # Handle image if provided
        if 'image' in request.FILES:
            event.image = request.FILES['image']
            event.save()
        
        # Return the created event
        serializer = EventInfoSerializer(event)
        return Response({
            'status': 'success',
            'message': 'Event created successfully',
            'event': serializer.data
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        import traceback
        print(f"Error creating event: {str(e)}")
        print(traceback.format_exc())
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)