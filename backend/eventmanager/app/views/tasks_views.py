#add task to event 
#add volunteer to task 
#task updates 
#task delete
#task edit 
#notify volunteers


### views/tasks_views.py ###
from rest_framework import viewsets
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from ..models import TaskInfo, EventInfo, User
from ..serializers.task_serializer import TaskInfoSerializer
import json
import traceback

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
    def post(self, request, event_id):
        """ Adds a new task to an event """
        try:
            if not request.user.is_authenticated:
                return JsonResponse({'status': 'error', 'message': 'Authentication required'}, status=401)

            try:
                event = EventInfo.objects.get(id=event_id)
            except EventInfo.DoesNotExist:
                return JsonResponse({'status': 'error', 'message': 'Event not found'}, status=404)

            data = json.loads(request.body)
            data['event'] = event.id
            serializer = TaskInfoSerializer(data=data)
            if serializer.is_valid():
                serializer.save()
                return JsonResponse({'status': 'success', 'task': serializer.data}, status=201)
            return JsonResponse({'status': 'error', 'message': serializer.errors}, status=400)
        except Exception as e:
            print(traceback.format_exc())
            return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

@method_decorator(csrf_exempt, name='dispatch')
class AddSubtaskView(View):
    def post(self, request, task_id):
        """ Optionally adds a subtask under a parent task """
        try:
            if not request.user.is_authenticated:
                return JsonResponse({'status': 'error', 'message': 'Authentication required'}, status=401)

            try:
                parent_task = TaskInfo.objects.get(id=task_id)
            except TaskInfo.DoesNotExist:
                return JsonResponse({'status': 'error', 'message': 'Parent task not found'}, status=404)

            data = json.loads(request.body)
            if not data:
                return JsonResponse({'status': 'success', 'message': 'No subtask added'}, status=200)

            data['event'] = parent_task.event.id
            serializer = TaskInfoSerializer(data=data)
            if serializer.is_valid():
                serializer.save()
                return JsonResponse({'status': 'success', 'subtask': serializer.data}, status=201)
            return JsonResponse({'status': 'error', 'message': serializer.errors}, status=400)
        except Exception as e:
            print(traceback.format_exc())
            return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

@method_decorator(csrf_exempt, name='dispatch')
class AssignVolunteerToTaskView(View):
    def post(self, request, task_id):
        """ Assign a volunteer to a task """
        try:
            if not request.user.is_authenticated:
                return JsonResponse({'status': 'error', 'message': 'Authentication required'}, status=401)
            
            try:
                task = TaskInfo.objects.get(id=task_id)
            except TaskInfo.DoesNotExist:
                return JsonResponse({'status': 'error', 'message': 'Task not found'}, status=404)
            
            data = json.loads(request.body)
            volunteer_id = data.get('volunteer')
            try:
                volunteer = User.objects.get(id=volunteer_id, isHost=False)
            except User.DoesNotExist:
                return JsonResponse({'status': 'error', 'message': 'Volunteer not found'}, status=404)
            
            task.volunteer = volunteer
            task.save()
            return JsonResponse({'status': 'success', 'message': 'Volunteer assigned successfully'}, status=200)
        except Exception as e:
            print(traceback.format_exc())
            return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

@method_decorator(csrf_exempt, name='dispatch')
class EditTaskView(View):
    def patch(self, request, task_id):
        """ Edit task details """
        try:
            if not request.user.is_authenticated:
                return JsonResponse({'status': 'error', 'message': 'Authentication required'}, status=401)
            
            try:
                task = TaskInfo.objects.get(id=task_id)
            except TaskInfo.DoesNotExist:
                return JsonResponse({'status': 'error', 'message': 'Task not found'}, status=404)
            
            data = json.loads(request.body)
            serializer = TaskInfoSerializer(task, data=data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return JsonResponse({'status': 'success', 'task': serializer.data}, status=200)
            return JsonResponse({'status': 'error', 'message': serializer.errors}, status=400)
        except Exception as e:
            print(traceback.format_exc())
            return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

@method_decorator(csrf_exempt, name='dispatch')
class DeleteTaskView(View):
    def delete(self, request, task_id):
        """ Delete a task """
        try:
            if not request.user.is_authenticated:
                return JsonResponse({'status': 'error', 'message': 'Authentication required'}, status=401)
            
            try:
                task = TaskInfo.objects.get(id=task_id)
            except TaskInfo.DoesNotExist:
                return JsonResponse({'status': 'error', 'message': 'Task not found'}, status=404)
            
            task.delete()
            return JsonResponse({'status': 'success', 'message': 'Task deleted successfully'}, status=204)
        except Exception as e:
            print(traceback.format_exc())
            return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
        
@method_decorator(csrf_exempt, name='dispatch')
class AssignVolunteerToTaskView(View):
    def post(self, request, task_id):
        """ Assign a volunteer to a task """
        try:
            if not request.user.is_authenticated:
                return JsonResponse({'status': 'error', 'message': 'Authentication required'}, status=401)
            
            try:
                task = TaskInfo.objects.get(id=task_id)
            except TaskInfo.DoesNotExist:
                return JsonResponse({'status': 'error', 'message': 'Task not found'}, status=404)
            
            data = json.loads(request.body)
            volunteer_id = data.get('volunteer')
            try:
                volunteer = User.objects.get(id=volunteer_id, isHost=False)
            except User.DoesNotExist:
                return JsonResponse({'status': 'error', 'message': 'Volunteer not found'}, status=404)
            
            task.volunteer = volunteer
            task.save()
            return JsonResponse({'status': 'success', 'message': 'Volunteer assigned successfully'}, status=200)
        except Exception as e:
            print(traceback.format_exc())
            return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

@method_decorator(csrf_exempt, name='dispatch')
class NotifyVolunteersView(View):
    def post(self, request, task_id):
        """ Notify volunteers about task updates """
        try:
            if not request.user.is_authenticated:
                return JsonResponse({'status': 'error', 'message': 'Authentication required'}, status=401)
            
            try:
                task = TaskInfo.objects.get(id=task_id)
            except TaskInfo.DoesNotExist:
                return JsonResponse({'status': 'error', 'message': 'Task not found'}, status=404)
            
            if not task.volunteer:
                return JsonResponse({'status': 'error', 'message': 'No volunteer assigned'}, status=400)
            
            return JsonResponse({'status': 'success', 'message': f'Notification sent to {task.volunteer.name}'}, status=200)
        except Exception as e:
            print(traceback.format_exc())
            return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

@method_decorator(csrf_exempt, name='dispatch')
class TakeTaskUpdatesView(View):
    def post(self, request, task_id):
        """ Volunteers submit task updates """
        try:
            if not request.user.is_authenticated:
                return JsonResponse({'status': 'error', 'message': 'Authentication required'}, status=401)
            
            try:
                task = TaskInfo.objects.get(id=task_id)
            except TaskInfo.DoesNotExist:
                return JsonResponse({'status': 'error', 'message': 'Task not found'}, status=404)
            
            data = json.loads(request.body)
            update_text = data.get('update')
            if update_text:
                task.taskanalysis = update_text
                task.save()
                return JsonResponse({'status': 'success', 'message': 'Task update submitted'}, status=200)
            return JsonResponse({'status': 'error', 'message': 'Update field is required'}, status=400)
        except Exception as e:
            print(traceback.format_exc())
            return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

@method_decorator(csrf_exempt, name='dispatch')
class AssignVolunteerToSubtaskView(View):
    def post(self, request, subtask_id):
        """ Assign a volunteer to a subtask """
        try:
            if not request.user.is_authenticated:
                return JsonResponse({'status': 'error', 'message': 'Authentication required'}, status=401)
            
            try:
                subtask = TaskInfo.objects.get(id=subtask_id)
            except TaskInfo.DoesNotExist:
                return JsonResponse({'status': 'error', 'message': 'Subtask not found'}, status=404)
            
            data = json.loads(request.body)
            volunteer_id = data.get('volunteer')
            try:
                volunteer = User.objects.get(id=volunteer_id, isHost=False)
            except User.DoesNotExist:
                return JsonResponse({'status': 'error', 'message': 'Volunteer not found'}, status=404)
            
            subtask.volunteer = volunteer
            subtask.save()
            return JsonResponse({'status': 'success', 'message': 'Volunteer assigned to subtask successfully'}, status=200)
        except Exception as e:
            print(traceback.format_exc())
            return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

@method_decorator(csrf_exempt, name='dispatch')
class NotifySubtaskVolunteersView(View):
    def post(self, request, subtask_id):
        """ Notify volunteers about subtask updates """
        try:
            if not request.user.is_authenticated:
                return JsonResponse({'status': 'error', 'message': 'Authentication required'}, status=401)
            
            try:
                subtask = TaskInfo.objects.get(id=subtask_id)
            except TaskInfo.DoesNotExist:
                return JsonResponse({'status': 'error', 'message': 'Subtask not found'}, status=404)
            
            if not subtask.volunteer:
                return JsonResponse({'status': 'error', 'message': 'No volunteer assigned to subtask'}, status=400)
            
            return JsonResponse({'status': 'success', 'message': f'Notification sent to {subtask.volunteer.name}'}, status=200)
        except Exception as e:
            print(traceback.format_exc())
            return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

@method_decorator(csrf_exempt, name='dispatch')
class TakeSubtaskUpdatesView(View):
    def post(self, request, subtask_id):
        """ Volunteers submit subtask updates """
        try:
            if not request.user.is_authenticated:
                return JsonResponse({'status': 'error', 'message': 'Authentication required'}, status=401)
            
            try:
                subtask = TaskInfo.objects.get(id=subtask_id)
            except TaskInfo.DoesNotExist:
                return JsonResponse({'status': 'error', 'message': 'Subtask not found'}, status=404)
            
            data = json.loads(request.body)
            update_text = data.get('update')
            if update_text:
                subtask.taskanalysis = update_text
                subtask.save()
                return JsonResponse({'status': 'success', 'message': 'Subtask update submitted'}, status=200)
            return JsonResponse({'status': 'error', 'message': 'Update field is required'}, status=400)
        except Exception as e:
            print(traceback.format_exc())
            return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
