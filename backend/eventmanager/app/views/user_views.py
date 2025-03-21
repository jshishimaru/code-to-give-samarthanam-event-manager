from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from ..models import User, EventInfo, TaskInfo, Chat
from ..serializers import UserSerializer, EventInfoSerializer, TaskInfoSerializer, ChatSerializer

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated()]
        return super().get_permissions()

    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        if request.user.id != int(kwargs['pk']):
            return Response({'error': 'You can only update your own profile.'}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if request.user.id != int(kwargs['pk']):
            return Response({'error': 'You can only delete your own profile.'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['get'])
    def enrolled_events(self, request, pk=None):
        user = self.get_object()
        events = user.enrolled_events.all()
        serializer = EventInfoSerializer(events, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def join_event(self, request, pk=None):
        user = self.get_object()
        event_id = request.data.get('event')
        try:
            event = EventInfo.objects.get(id=event_id)
        except EventInfo.DoesNotExist:
            return Response({'error': 'Event not found'}, status=status.HTTP_404_NOT_FOUND)
        event.volunteer_enrolled.add(user)
        return Response({'message': 'Successfully joined the event'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'])
    def assigned_tasks(self, request, pk=None):
        user = self.get_object()
        tasks = TaskInfo.objects.filter(volunteer=user)
        serializer = TaskInfoSerializer(tasks, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def complete_task(self, request, pk=None):
        user = self.get_object()
        task_id = request.data.get('task')
        try:
            task = TaskInfo.objects.get(id=task_id, volunteer=user)
        except TaskInfo.DoesNotExist:
            return Response({'error': 'Task not found or unauthorized'}, status=status.HTTP_404_NOT_FOUND)
        task.status = 'Completed'
        task.save()
        return Response({'message': 'Task marked as completed'}, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['get'])
    def view_chats(self, request, pk=None):
        user = self.get_object()
        chats = Chat.objects.filter(task__volunteer=user)
        serializer = ChatSerializer(chats, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def send_chat(self, request, pk=None):
        user = self.get_object()
        task_id = request.data.get('task')
        message = request.data.get('text')
        try:
            task = TaskInfo.objects.get(id=task_id, volunteer=user)
        except TaskInfo.DoesNotExist:
            return Response({'error': 'Task not found or unauthorized'}, status=status.HTTP_404_NOT_FOUND)
        
        chat = Chat.objects.create(user=user, task=task, text=message)
        serializer = ChatSerializer(chat)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
