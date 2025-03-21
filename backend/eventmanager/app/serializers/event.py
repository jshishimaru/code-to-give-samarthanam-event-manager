from rest_framework import serializers
from ..models import EventInfo, Host, User

class EventInfoSerializer(serializers.ModelSerializer):
    host_name = serializers.SerializerMethodField()
    enrolled_count = serializers.SerializerMethodField()
    
    class Meta:
        model = EventInfo
        fields = '__all__'
    
    def get_host_name(self, obj):
        return obj.host.name if obj.host else None
    
    def get_enrolled_count(self, obj):
        return obj.volunteer_enrolled.count()