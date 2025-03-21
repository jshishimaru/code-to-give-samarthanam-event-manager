from rest_framework import serializers
from ..models import EventInfo
from .host_serializer import HostSerializer
from .user_serializer import UserSerializer

class EventInfoSerializer(serializers.ModelSerializer):
    host = HostSerializer(read_only=True)
    volunteer_enrolled = UserSerializer(many=True, read_only=True)
    
    class Meta:
        model = EventInfo
        fields = ['id', 'event_name', 'overview', 'description', 'start_time', 'end_time', 'host', 'volunteer_enrolled', 'required_volunteers', 'points_for_volunteers', 'status', 'volunteer_efficiency', 'task_analysis']

