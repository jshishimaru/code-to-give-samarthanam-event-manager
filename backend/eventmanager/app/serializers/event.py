from rest_framework import serializers
from ..models import EventInfo, Host, User

class EventInfoSerializer(serializers.ModelSerializer):
    host_name = serializers.SerializerMethodField()
    enrolled_count = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = EventInfo
        fields = '__all__'
    
    def get_host_name(self, obj):
        return obj.host.name if obj.host else None
    
    def get_enrolled_count(self, obj):
        return obj.volunteer_enrolled.count()
    
    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None