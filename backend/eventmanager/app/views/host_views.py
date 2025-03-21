### views/host_views.py ###
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from ..models import Host, EventInfo, TaskInfo, User, Chat
from ..serializers import HostSerializer, EventInfoSerializer, TaskInfoSerializer, ChatSerializer

class HostViewSet(viewsets.ModelViewSet):
    queryset = Host.objects.all()
    serializer_class = HostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def create_event(self, request, pk=None):
        host = self.get_object()
        request.data['host'] = host.id
        serializer = EventInfoSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def create_task(self, request, pk=None):
        host = self.get_object()
        event_id = request.data.get('event')
        try:
            event = EventInfo.objects.get(id=event_id, host=host)
        except EventInfo.DoesNotExist:
            return Response({'error': 'Event not found or unauthorized'}, status=status.HTTP_404_NOT_FOUND)
        request.data['event'] = event.id
        serializer = TaskInfoSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def assign_volunteer(self, request, pk=None):
        host = self.get_object()
        task_id = request.data.get('task')
        volunteer_id = request.data.get('volunteer')
        try:
            task = TaskInfo.objects.get(id=task_id, event__host=host)
            volunteer = User.objects.get(id=volunteer_id)
        except (TaskInfo.DoesNotExist, User.DoesNotExist):
            return Response({'error': 'Invalid task or volunteer'}, status=status.HTTP_404_NOT_FOUND)
        task.volunteer = volunteer
        task.save()
        return Response({'message': 'Volunteer assigned successfully'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'])
    def track_tasks(self, request, pk=None):
        host = self.get_object()
        tasks = TaskInfo.objects.filter(event__host=host)
        serializer = TaskInfoSerializer(tasks, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def view_chats(self, request, pk=None):
        host = self.get_object()
        chats = Chat.objects.filter(task__event__host=host)
        serializer = ChatSerializer(chats, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def respond_to_chat(self, request, pk=None):
        host = self.get_object()
        task_id = request.data.get('task')
        message = request.data.get('text')
        try:
            task = TaskInfo.objects.get(id=task_id, event__host=host)
        except TaskInfo.DoesNotExist:
            return Response({'error': 'Task not found or unauthorized'}, status=status.HTTP_404_NOT_FOUND)
        
        chat = Chat.objects.create(user=None, task=task, text=message)  # Host responding anonymously
        serializer = ChatSerializer(chat)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
