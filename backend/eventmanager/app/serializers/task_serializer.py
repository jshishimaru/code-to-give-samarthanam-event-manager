from rest_framework import serializers
from ..models import TaskInfo
from .user_serializer import UserSerializer
from .event_serializer import EventInfoSerializer

class TaskInfoSerializer(serializers.ModelSerializer):
    volunteer = UserSerializer(read_only=True)
    event = EventInfoSerializer(read_only=True)
    
    class Meta:
        model = TaskInfo
        fields = ['id', 'volunteer', 'event', 'task_name', 'description', 'start_time', 'end_time', 'status', 'volunteereffieciency', 'taskanalysis']
