from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from ..models import EventInfo, Feedback, User
from ..serializers.feedback import FeedbackSerializer
import json
import traceback

@method_decorator(csrf_exempt, name='dispatch')
class EventFeedbackListView(View):
    """
    Get all feedback IDs for a specific event
    """
    def get(self, request):
        try:
            # Get event_id from query parameters
            event_id = request.GET.get('event_id')
            
            if not event_id:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Event ID is required'
                }, status=400)
            
            # Check if event exists
            try:
                event = EventInfo.objects.get(id=event_id)
            except EventInfo.DoesNotExist:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Event not found'
                }, status=404)
            
            # Get all feedback IDs for this event
            feedback_ids = list(event.feedbacks.values_list('id', flat=True))
            
            # Add some summary statistics
            average_ratings = []
            feedback_count = len(feedback_ids)
            would_volunteer_again_count = event.feedbacks.filter(would_volunteer_again=True).count()
            
            for feedback in event.feedbacks.all():
                if hasattr(feedback, 'average_rating'):
                    average_ratings.append(feedback.average_rating)
            
            overall_average = sum(average_ratings) / len(average_ratings) if average_ratings else 0
            
            return JsonResponse({
                'status': 'success',
                'event_id': event_id,
                'event_name': event.event_name,
                'feedback_count': feedback_count,
                'feedback_ids': feedback_ids,
                'overall_average_rating': round(overall_average, 2),
                'would_volunteer_again_percentage': round((would_volunteer_again_count / feedback_count * 100), 2) if feedback_count > 0 else 0
            })
            
        except Exception as e:
            print(f"Error in EventFeedbackListView: {str(e)}")
            print(traceback.format_exc())
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            }, status=500)
    
    def post(self, request):
        # POST method can use the same logic as GET for this view
        return self.get(request)


@method_decorator(csrf_exempt, name='dispatch')
class FeedbackDetailView(View):
    """
    Get detailed information about a specific feedback
    """
    def get(self, request):
        try:
            # Get feedback_id from query parameters
            feedback_id = request.GET.get('feedback_id')
            
            if not feedback_id:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Feedback ID is required'
                }, status=400)
            
            # Get the feedback
            feedback = get_object_or_404(Feedback, id=feedback_id)
            
            # Serialize the feedback data
            serializer = FeedbackSerializer(feedback)
            
            return JsonResponse({
                'status': 'success',
                'feedback': serializer.data
            })
            
        except Feedback.DoesNotExist:
            return JsonResponse({
                'status': 'error',
                'message': 'Feedback not found'
            }, status=404)
            
        except Exception as e:
            print(f"Error in FeedbackDetailView: {str(e)}")
            print(traceback.format_exc())
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            }, status=500)
    
    def post(self, request):
        # POST method can use the same logic as GET for this view
        return self.get(request)


@method_decorator(csrf_exempt, name='dispatch')
class SubmitFeedbackView(View):
    """
    Submit feedback for an event
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
            
            # Check if user is a volunteer (only volunteers can submit feedback)
            if user.isHost:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Hosts cannot submit feedback'
                }, status=403)
            
            # Extract data from request
            data = request.POST if request.POST else json.loads(request.body)
            
            # Get required fields
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
            
            # Check if user was enrolled in this event
            if user not in event.volunteer_enrolled.all():
                return JsonResponse({
                    'status': 'error',
                    'message': 'You can only submit feedback for events you participated in'
                }, status=403)
            
            # Check if event is completed
            if event.status != 'Completed':
                return JsonResponse({
                    'status': 'error',
                    'message': 'Feedback can only be submitted for completed events'
                }, status=400)
            
            # Check if user already submitted feedback for this event
            if Feedback.objects.filter(event=event, user=user).exists():
                return JsonResponse({
                    'status': 'error',
                    'message': 'You have already submitted feedback for this event'
                }, status=400)
            
            # Create feedback object
            feedback = Feedback(
                event=event,
                user=user,
                # Ratings
                overall_experience=data.get('overall_experience', 5),
                organization_quality=data.get('organization_quality', 5),
                communication=data.get('communication', 5),
                host_interaction=data.get('host_interaction', 5),
                volunteer_support=data.get('volunteer_support'),
                task_clarity=data.get('task_clarity', 5),
                impact_awareness=data.get('impact_awareness'),
                inclusivity=data.get('inclusivity', 5),
                time_management=data.get('time_management', 5),
                recognition=data.get('recognition', 5),
                # Text feedback
                strengths=data.get('strengths', ''),
                improvements=data.get('improvements', ''),
                additional_comments=data.get('additional_comments', ''),
                # Would volunteer again
                would_volunteer_again=data.get('would_volunteer_again', True),
            )
            
            # Save the feedback
            feedback.save()
            
            # Return the created feedback
            serializer = FeedbackSerializer(feedback)
            return JsonResponse({
                'status': 'success',
                'message': 'Feedback submitted successfully',
                'feedback': serializer.data
            })
            
        except Exception as e:
            print(f"Error in SubmitFeedbackView: {str(e)}")
            print(traceback.format_exc())
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            }, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class UserFeedbackListView(View):
    """
    Get all feedback IDs submitted by the authenticated user
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
            
            # Get all feedback IDs submitted by this user
            feedback_ids = list(user.given_feedbacks.values_list('id', flat=True))
            
            return JsonResponse({
                'status': 'success',
                'user_id': user.id,
                'user_name': user.name,
                'feedback_count': len(feedback_ids),
                'feedback_ids': feedback_ids
            })
            
        except Exception as e:
            print(f"Error in UserFeedbackListView: {str(e)}")
            print(traceback.format_exc())
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            }, status=500)
    
    def post(self, request):
        return self.get(request)

@method_decorator(csrf_exempt, name='dispatch')
class CheckFeedbackEligibilityView(View):
    """
    Check if the authenticated user is eligible to submit feedback for a specific event
    """
    def get(self, request):
        try:
            # Get the authenticated user
            user = request.user
            
            # Check if user is authenticated
            if not user.is_authenticated:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Authentication required',
                    'eligible': False
                }, status=401)
            
            # Check if user is a volunteer (only volunteers can submit feedback)
            if user.isHost:
                return JsonResponse({
                    'status': 'success',
                    'eligible': False,
                    'reason': 'Hosts cannot submit feedback'
                })
            
            # Get event_id from query parameters
            event_id = request.GET.get('event_id')
            
            if not event_id:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Event ID is required',
                    'eligible': False
                }, status=400)
            
            # Get the event
            try:
                event = EventInfo.objects.get(id=event_id)
            except EventInfo.DoesNotExist:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Event not found',
                    'eligible': False
                }, status=404)
            
            # Check multiple eligibility criteria
            
            # 1. Check if user was enrolled in this event
            if user not in event.volunteer_enrolled.all():
                return JsonResponse({
                    'status': 'success',
                    'eligible': False,
                    'reason': 'You can only submit feedback for events you participated in'
                })
            
            # 2. Check if event is completed
            if event.status != 'Completed':
                return JsonResponse({
                    'status': 'success',
                    'eligible': False,
                    'reason': 'Feedback can only be submitted for completed events',
                    'current_status': event.status
                })
            
            # 3. Check if user already submitted feedback for this event
            if Feedback.objects.filter(event=event, user=user).exists():
                feedback = Feedback.objects.get(event=event, user=user)
                return JsonResponse({
                    'status': 'success',
                    'eligible': False,
                    'reason': 'You have already submitted feedback for this event',
                    'existing_feedback_id': feedback.id
                })
            
            # If all checks pass, user is eligible
            return JsonResponse({
                'status': 'success',
                'eligible': True,
                'event_id': event.id,
                'event_name': event.event_name
            })
            
        except Exception as e:
            print(f"Error in CheckFeedbackEligibilityView: {str(e)}")
            print(traceback.format_exc())
            return JsonResponse({
                'status': 'error',
                'message': str(e),
                'eligible': False
            }, status=500)
    
    def post(self, request):
        # POST method can use the same logic as GET for this view
        return self.get(request)