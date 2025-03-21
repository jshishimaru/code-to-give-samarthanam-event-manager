from rest_framework import serializers
from ..models import TaskInfo, User, EventInfo

class TaskInfoSerializer(serializers.ModelSerializer):
    volunteer_name = serializers.SerializerMethodField()
    event_name = serializers.SerializerMethodField()
    
    class Meta:
        model = TaskInfo
        fields = '__all__'
    
    def get_volunteer_name(self, obj):
        return obj.volunteer.name if obj.volunteer else None
    
    def get_event_name(self, obj):
        return obj.event.event_name if obj.event else None