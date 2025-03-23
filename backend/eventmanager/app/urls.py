from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import event_views
from .views import feeback_views
from .views import tasks_views
from .views import chats_views
from .views import taskchat_views
# router = DefaultRouter()
# router.register(r'events', event_views.EventViewSet, basename='events')

urlpatterns = [
    # Event endpoints (accessible without authentication)
    path('events/upcoming/', event_views.AllUpcomingEventsView.as_view(), name='all_upcoming_events'),
    path('events/ongoing/', event_views.AllOngoingEventsView.as_view(), name='all_ongoing_events'),
    path('events/details/', event_views.EventDetailsView.as_view(), name='get_event_details'),
    
    # User-specific event endpoints (require authentication)
    path('user/events/enrolled/', event_views.UserEnrolledEventsView.as_view(), name='user_enrolled_events'),
    path('user/events/past/', event_views.UserPastEventsView.as_view(), name='user_past_events'),
    path('user/events/upcoming/', event_views.UserUpcomingEventsView.as_view(), name='user_upcoming_events'),
    path('user/events/ongoing/', event_views.UserOngoingEventsView.as_view(), name='user_ongoing_events'),
    path('user/events/enroll/', event_views.EnrollUserView.as_view(), name='enroll_user_in_event'),
    path('user/events/unenroll/', event_views.UnenrollUserView.as_view(), name='unenroll_from_event'),
    path('user/events/check-enrollment/', event_views.CheckUserEnrollmentView.as_view(), name='check_user_enrollment'),
    
    # Host-specific event endpoints (require authentication as host)
    path('host/events/', event_views.HostEventsView.as_view(), name='host_events'),
    path('host/events/ongoing/', event_views.HostOngoingEventsView.as_view(), name='host_ongoing_events'),
    path('host/events/create/', event_views.CreateEventView.as_view(), name='create_event'),
    path('host/events/update/', event_views.UpdateEventView.as_view(), name='update_event'),

    # Feedback endpoints
    path('feedback/event/', feeback_views.EventFeedbackListView.as_view(), name='event_feedback_list'),
    path('feedback/detail/', feeback_views.FeedbackDetailView.as_view(), name='feedback_detail'),
    path('feedback/submit/', feeback_views.SubmitFeedbackView.as_view(), name='submit_feedback'),
    path('feedback/user/', feeback_views.UserFeedbackListView.as_view(), name='user_feedback_list'),
    path('feedback/eligibility/', feeback_views.CheckFeedbackEligibilityView.as_view(), name='check_feedback_eligibility'),
    
	# Task Management Endpoints
	path('tasks/add/', tasks_views.AddTaskToEventView.as_view(), name='add_task_to_event'),
	path('tasks/assign-volunteers/', tasks_views.AssignVolunteerToTaskView.as_view(), name='assign_volunteers_to_task'),
	path('tasks/update/', tasks_views.EditTaskView.as_view(), name='edit_task'),
	path('tasks/delete/', tasks_views.DeleteTaskView.as_view(), name='delete_task'),
	path('tasks/details/', tasks_views.GetTaskWithSubtasksView.as_view(), name='get_task_with_subtasks'),

	# Task Notification Endpoints
	path('tasks/notify-completion/', tasks_views.NotifyTaskCompletionView.as_view(), name='notify_task_completion'),
	path('tasks/mark-complete/', tasks_views.MarkTaskCompleteView.as_view(), name='mark_task_complete'),
	path('tasks/notified/', tasks_views.GetNotifiedTasksView.as_view(), name='get_notified_tasks'),
	path('tasks/volunteer/', tasks_views.GetVolunteerTasksView.as_view(), name='get_volunteer_tasks'),
	path('tasks/event/', tasks_views.GetEventTasksView.as_view(), name='get_event_tasks'),
    
    # Subtask Management Endpoints
    path('subtasks/add/', tasks_views.AddSubtaskView.as_view(), name='add_subtask'),
    path('subtasks/notify-completion/', tasks_views.NotifySubtaskCompletionView.as_view(), name='notify_subtask_completion'),
    path('subtasks/mark-complete/', tasks_views.MarkSubtaskCompleteView.as_view(), name='mark_subtask_complete'),
    path('subtasks/notified/', tasks_views.GetNotifiedSubtasksView.as_view(), name='get_notified_subtasks'),

	# chat endpoints 
	path('events/chat/', chats_views.EventChatView.as_view(), name='event_chat'),
	path('events/chat/history/', chats_views.EventChatHistoryView.as_view(), name='event_chat_history'),
	path('user/chats/recent/', chats_views.RecentEventChatsView.as_view(), name='recent_event_chats'),

    # Task Chat Endpoints
	path('tasks/chat/', taskchat_views.TaskChatView.as_view(), name='task_chat'),
	path('tasks/chat/history/', taskchat_views.TaskChatHistoryView.as_view(), name='task_chat_history'),
	path('user/tasks/chats/recent/', taskchat_views.RecentTaskChatsView.as_view(), name='recent_task_chats'),
]