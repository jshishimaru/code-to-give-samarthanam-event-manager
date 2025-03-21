from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from ..models import EventInfo, User, TaskInfo
from ..serializers import EventInfoSerializer, TaskInfoSerializer

class EventViewSet(viewsets.ModelViewSet):
    queryset = EventInfo.objects.all()
    serializer_class = EventInfoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        request.data['host'] = request.user.id
        return super().create(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def enroll_volunteer(self, request, pk=None):
        event = self.get_object()
        user_id = request.data.get('user')
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        event.volunteer_enrolled.add(user)
        return Response({'message': 'Volunteer enrolled successfully'}, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def assign_task(self, request, pk=None):
        event = self.get_object()
        volunteer_id = request.data.get('volunteer')
        task_data = {
            'event': event.id,
            'volunteer': volunteer_id,
            'task_name': request.data.get('task_name'),
            'description': request.data.get('description'),
            'start_time': request.data.get('start_time'),
            'end_time': request.data.get('end_time'),
            'status': 'Pending'
        }
        serializer = TaskInfoSerializer(data=task_data)
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Task assigned successfully'}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def task_status(self, request, pk=None):
        event = self.get_object()
        tasks = TaskInfo.objects.filter(event=event)
        serializer = TaskInfoSerializer(tasks, many=True)
        return Response(serializer.data)
