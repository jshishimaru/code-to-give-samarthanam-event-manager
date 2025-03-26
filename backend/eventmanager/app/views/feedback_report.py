from django.views import View
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from ..models import EventInfo, Feedback, TaskInfo, SubTask
from ..ml.feedback_report import generate_event_report
from django.core.exceptions import ObjectDoesNotExist
import traceback

@method_decorator(csrf_exempt, name='dispatch')
class GenerateEventReportView(View):
    """Generate comprehensive event report with feedback analysis"""
    
    def get(self, request):
        try:
            # Get event_id from query parameters
            event_id = request.GET.get('event_id')
            if not event_id:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Event ID is required'
                }, status=400)
            
            # Get the event and verify access
            try:
                event = EventInfo.objects.get(id=event_id)
            except EventInfo.DoesNotExist:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Event not found'
                }, status=404)
            
            # Check if user is authenticated and is the host of this event
            if not request.user.is_authenticated:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Authentication required'
                }, status=401)
            
            if not request.user.isHost or event.host_id != request.user.id:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Only the event host can access this report'
                }, status=403)
            
            # Gather all required data
            feedback_list = list(Feedback.objects.filter(event=event).values(
                'overall_experience', 'organization_quality', 'communication',
                'host_interaction', 'volunteer_support', 'task_clarity',
                'impact_awareness', 'inclusivity', 'time_management',
                'recognition', 'strengths', 'improvements', 'additional_comments',
                'would_volunteer_again'
            ))
            
            task_list = list(TaskInfo.objects.filter(event=event).values(
                'task_name', 'status', 'notification_message',
                'volunteer_efficiency', 'task_analysis'
            ))
            
            subtask_list = list(SubTask.objects.filter(parent_task__event=event).values(
                'title', 'status', 'completion_percentage', 'notification_message'
            ))
            
            # Prepare event data
            event_data = {
                'event_name': event.event_name,
                'start_time': event.start_time.strftime('%Y-%m-%d %H:%M'),
                'end_time': event.end_time.strftime('%Y-%m-%d %H:%M'),
                'location': event.location,
                'host': event.host.name,
                'volunteer_enrolled': event.volunteer_enrolled.count(),
                'required_volunteers': event.required_volunteers,
                'overview': event.overview,
                'task_analysis': event.task_analysis
            }
            
            # Generate the report
            report = generate_event_report(
                event=event_data,
                feedback_list=feedback_list,
                task_list=task_list,
                subtask_list=subtask_list
            )
            
            return JsonResponse({
                'status': 'success',
                'report': report
            })
            
        except Exception as e:
            print(f"Error in GenerateEventReportView: {str(e)}")
            print(traceback.format_exc())
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            }, status=500)

@method_decorator(csrf_exempt, name='dispatch')
class EventFeedbackAnalyticsView(View):
    """Get detailed analytics for event feedback"""
    
    def get(self, request):
        try:
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
            
            # Check authentication and permissions
            if not request.user.is_authenticated or (not request.user.isHost and event.host_id != request.user.id):
                return JsonResponse({
                    'status': 'error',
                    'message': 'Permission denied'
                }, status=403)
            
            # Get all feedback for this event
            feedbacks = Feedback.objects.filter(event=event)
            
            # Basic statistics
            total_feedback = feedbacks.count()
            would_volunteer_again = feedbacks.filter(would_volunteer_again=True).count()
            
            # Calculate average ratings
            rating_fields = [
                'overall_experience', 'organization_quality', 'communication',
                'host_interaction', 'volunteer_support', 'task_clarity',
                'impact_awareness', 'inclusivity', 'time_management', 'recognition'
            ]
            
            averages = {}
            for field in rating_fields:
                values = list(filter(None, [getattr(f, field) for f in feedbacks]))
                averages[field] = sum(values) / len(values) if values else 0
            
            # Get common themes from text feedback
            strengths = list(feedbacks.values_list('strengths', flat=True))
            improvements = list(feedbacks.values_list('improvements', flat=True))
            comments = list(feedbacks.values_list('additional_comments', flat=True))
            
            # Get task completion statistics
            tasks = TaskInfo.objects.filter(event=event)
            total_tasks = tasks.count()
            completed_tasks = tasks.filter(status='Completed').count()
            
            return JsonResponse({
                'status': 'success',
                'analytics': {
                    'feedback_count': total_feedback,
                    'volunteer_retention': {
                        'would_volunteer_again': would_volunteer_again,
                        'percentage': (would_volunteer_again / total_feedback * 100) if total_feedback > 0 else 0
                    },
                    'average_ratings': averages,
                    'task_completion': {
                        'total': total_tasks,
                        'completed': completed_tasks,
                        'completion_rate': (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
                    },
                    'text_feedback': {
                        'strengths': strengths,
                        'improvements': improvements,
                        'comments': comments
                    }
                }
            })
            
        except Exception as e:
            print(f"Error in EventFeedbackAnalyticsView: {str(e)}")
            print(traceback.format_exc())
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            }, status=500)