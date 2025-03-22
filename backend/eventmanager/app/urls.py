from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import event_views
from .views import feeback_views

# router = DefaultRouter()
# router.register(r'events', event_views.EventViewSet, basename='events')

urlpatterns = [
    # path('', include(router.urls)),
    
    # Event endpoints (accessible without authentication)
    path('events/upcoming/', event_views.AllUpcomingEventsView.as_view(), name='all_upcoming_events'),
    path('events/details/', event_views.EventDetailsView.as_view(), name='get_event_details'),
    
    # User-specific event endpoints (require authentication)
    path('user/events/enrolled/', event_views.UserEnrolledEventsView.as_view(), name='user_enrolled_events'),
    path('user/events/past/', event_views.UserPastEventsView.as_view(), name='user_past_events'),
    path('user/events/upcoming/', event_views.UserUpcomingEventsView.as_view(), name='user_upcoming_events'),
    path('user/events/enroll/', event_views.EnrollUserView.as_view(), name='enroll_user_in_event'),
    path('user/events/unenroll/', event_views.UnenrollUserView.as_view(), name='unenroll_from_event'),
    
    # Host-specific event endpoints (require authentication as host)
    path('host/events/', event_views.HostEventsView.as_view(), name='host_events'),
    path('host/events/create/', event_views.CreateEventView.as_view(), name='create_event'),
    path('host/events/update/', event_views.UpdateEventView.as_view(), name='update_event'),

	path('feedback/event/', feeback_views.EventFeedbackListView.as_view(), name='event_feedback_list'),
	path('feedback/detail/', feeback_views.FeedbackDetailView.as_view(), name='feedback_detail'),
	path('feedback/submit/', feeback_views.SubmitFeedbackView.as_view(), name='submit_feedback'),
	path('feedback/user/', feeback_views.UserFeedbackListView.as_view(), name='user_feedback_list'),
	path('feedback/eligibility/', feeback_views.CheckFeedbackEligibilityView.as_view(), name='check_feedback_eligibility'),
	
]