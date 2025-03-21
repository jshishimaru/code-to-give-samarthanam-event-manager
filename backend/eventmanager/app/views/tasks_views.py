from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from ..models import TaskInfo, Chat, User
from ..serializers import TaskInfoSerializer, ChatSerializer, UserSerializer

class TaskViewSet(viewsets.ModelViewSet):
    queryset = TaskInfo.objects.all()
    serializer_class = TaskInfoSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        task = self.get_object()
        new_status = request.data.get('status')
        task.status = new_status
        task.save()
        return Response({'message': 'Task status updated successfully'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'])
    def volunteers(self, request, pk=None):
        task = self.get_object()
        volunteer = task.volunteer
        serializer = UserSerializer(volunteer)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def chats(self, request, pk=None):
        task = self.get_object()
        chats = Chat.objects.filter(task=task)
        serializer = ChatSerializer(chats, many=True)
        return Response(serializer.data)
