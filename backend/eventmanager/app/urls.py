from django.urls import path
from app.views.event_views import (
    user_enrolled_events, 
    user_past_events, 
    user_upcoming_events,
    all_upcoming_events,
	get_event_details,
	enroll_user_in_event,
	update_event,
	create_event
)


urlpatterns = [
    path('events/enrolled/', user_enrolled_events, name='user_enrolled_events'),
    path('events/past/', user_past_events, name='user_past_events'),
    path('events/user/upcoming/', user_upcoming_events, name='user_upcoming_events'),    
    path('events/upcoming/', all_upcoming_events, name='all_upcoming_events'),
    path('events/details/', get_event_details, name='get_event_details'),
    path('events/enroll/', enroll_user_in_event, name='enroll_user_in_event'),
    path('events/update/', update_event, name='update_event'),
	path('events/create/', create_event, name='create_event'), 
]